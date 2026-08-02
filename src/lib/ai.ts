import { createGroq } from "@ai-sdk/groq";
import { APICallError, generateText, Output } from "ai";
import { z } from "zod";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

// Groq only supports strict json_schema constrained decoding on the gpt-oss
// family. Every other model has to fall back to loose json_object mode, which
// the provider expects us to opt into explicitly.
const structuredOutputs = MODEL.includes("gpt-oss");

const providerOptions = { groq: { structuredOutputs } };

// Strict mode uses constrained decoding, which only understands a subset of
// JSON Schema — array length bounds (minItems/maxItems) are not part of it.
// Counts are therefore stated in the prompt and checked in code instead.
const chapterSchema = z.object({
  chapter_title: z.string().describe("title of the chapter"),
  youtube_search_query: z
    .string()
    .describe(
      "a detailed youtube search query that will find an informative educational video for this chapter"
    ),
});

const courseUnitsSchema = z.object({
  units: z
    .array(
      z.object({
        title: z.string().describe("title of the unit"),
        chapters: z
          .array(chapterSchema)
          .describe("the chapters that make up this unit"),
      })
    )
    .describe("the units that make up the course"),
});

const imageSearchTermSchema = z.object({
  image_search_term: z
    .string()
    .describe(
      "a good unsplash search term for the title image of the course"
    ),
});

const chapterContentSchema = z.object({
  summary: z
    .string()
    .describe(
      "a summary of the transcript in 250 words or less, without mentioning sponsors or introducing what the summary is about"
    ),
  questions: z
    .array(
      z.object({
        question: z.string().describe("the question"),
        answer: z.string().describe("the correct answer, max 15 words"),
        option1: z.string().describe("a wrong answer, max 15 words"),
        option2: z.string().describe("a wrong answer, max 15 words"),
        option3: z.string().describe("a wrong answer, max 15 words"),
      })
    )
    .describe("multiple choice questions about the chapter"),
});

export type CourseUnit = z.infer<typeof courseUnitsSchema>["units"][number];
export type ChapterQuestion = z.infer<
  typeof chapterContentSchema
>["questions"][number];

const MAX_ATTEMPTS = 5;
// Deliberately long. On Groq's free tier the token-per-minute bucket can take
// a full minute to refill, and waiting it out is preferable to shortening
// prompts, which would cost output quality.
const FALLBACK_WAITS_MS = [20_000, 45_000, 90_000, 90_000];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Returns how long to wait before retrying a rate-limited call, or null if the
 * error is not a rate limit and should propagate immediately.
 */
function getRateLimitWaitMs(error: unknown, attempt: number): number | null {
  if (!APICallError.isInstance(error) || error.statusCode !== 429) {
    return null;
  }

  const headers = error.responseHeaders ?? {};
  const retryAfterMs = Number(headers["retry-after-ms"]);
  const retryAfterSeconds = Number(headers["retry-after"]);

  let waitMs: number;
  if (Number.isFinite(retryAfterMs) && retryAfterMs > 0) {
    waitMs = retryAfterMs;
  } else if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    waitMs = retryAfterSeconds * 1000;
  } else {
    waitMs = FALLBACK_WAITS_MS[Math.min(attempt, FALLBACK_WAITS_MS.length - 1)];
  }

  // Jitter so concurrent workers don't wake up and collide on the same bucket.
  return waitMs + Math.random() * 2000;
}

async function withRateLimitRetry<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const waitMs = getRateLimitWaitMs(error, attempt);
      if (waitMs === null || attempt >= MAX_ATTEMPTS - 1) {
        throw error;
      }
      console.log(
        `[ai] ${label}: rate limited, waiting ${Math.round(
          waitMs / 1000
        )}s before attempt ${attempt + 2}/${MAX_ATTEMPTS}`
      );
      await sleep(waitMs);
    }
  }
}

async function generateStructured<T>({
  label,
  schema,
  system,
  prompt,
  temperature,
}: {
  label: string;
  schema: z.ZodType<T>;
  system: string;
  prompt: string;
  temperature?: number;
}): Promise<T> {
  return withRateLimitRetry(label, async () => {
    const result = await generateText({
      model: groq(MODEL),
      system,
      prompt,
      temperature,
      providerOptions,
      // Our own retry loop handles 429s; the SDK's built-in backoff is far too
      // short for a token-per-minute window and would burn attempts.
      maxRetries: 0,
      output: Output.object({ schema }),
    });
    return result.output;
  });
}

export async function generateCourseUnits(
  courseTitle: string,
  unitTitles: string[]
): Promise<CourseUnit[]> {
  const { units } = await generateStructured({
    label: "course units",
    schema: courseUnitsSchema,
    system:
      "You are a powerful AI agent capable of curating course content, coming up with relevant chapter titles, and finding relevant youtube videos for each chapter.",
    prompt: `You are tasked with creating a course about "${courseTitle}".

Create exactly ${unitTitles.length} units, one for each of the following topics, in this order:
${unitTitles.map((title, i) => `${i + 1}. ${title}`).join("\n")}

For each unit, break it into chapters. For each chapter, provide a detailed youtube search query that will find an informative, educational and relevant video for that chapter.`,
    temperature: 0.7,
  });

  if (units.length === 0) {
    throw new Error("The model returned no units for this course");
  }

  return units;
}

export async function generateImageSearchTerm(
  courseTitle: string
): Promise<string> {
  const { image_search_term } = await generateStructured({
    label: "image search term",
    schema: imageSearchTermSchema,
    system:
      "You are a powerful AI capable of finding the most relevant image for a course.",
    prompt: `Please provide a good image search term for the title of a course about "${courseTitle}". This search term will be fed into the Unsplash API, so make sure it is a good search term that will return good results.`,
  });

  return image_search_term;
}

export async function generateChapterContent(
  chapterName: string,
  transcript: string
): Promise<{ summary: string; questions: ChapterQuestion[] }> {
  const { summary, questions } = await generateStructured({
    label: `chapter "${chapterName}"`,
    schema: chapterContentSchema,
    system:
      "You are a powerful AI that summarizes educational video transcripts and writes multiple choice questions about them.",
    prompt: `The following is a transcript from a youtube video about "${chapterName}".

Summarize it in 250 words or less. Do not talk about sponsors or anything unrelated to the main topic, and do not introduce what the summary is about.

Then write exactly 5 hard multiple choice questions about "${chapterName}", using the transcript as context. Each question must have one correct answer and three wrong answers, and no answer may be longer than 15 words.

Transcript:
${transcript}`,
    temperature: 0.7,
  });

  if (questions.length === 0) {
    throw new Error(`The model returned no questions for "${chapterName}"`);
  }

  return { summary, questions: questions.slice(0, 5) };
}
