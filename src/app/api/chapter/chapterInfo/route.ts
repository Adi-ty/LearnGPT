import { prisma } from "@/lib/db";
import { generateChapterContent } from "@/lib/ai";
import { getTranscript, searchYoutube } from "@/lib/youtube";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodyParser = z.object({
  chapterId: z.string(),
});

export async function POST(req: Request, res: Response) {
  try {
    const body = await req.json();
    const { chapterId } = bodyParser.parse(body);

    const chapter = await prisma.chapter.findUnique({
      where: {
        id: chapterId,
      },
    });
    if (!chapter) {
      return NextResponse.json(
        {
          success: false,
          error: "Chapter not found",
        },
        { status: 404 }
      );
    }

    const videoId = await searchYoutube(chapter.youtubeSearchQuery);
    if (!videoId) {
      return NextResponse.json(
        {
          success: false,
          error: "No youtube video found for this chapter",
        },
        { status: 404 }
      );
    }

    let transcript = await getTranscript(videoId);
    transcript = transcript.split(" ").slice(0, 500).join(" ");

    const { summary, questions } = await generateChapterContent(
      chapter.name,
      transcript
    );

    await prisma.question.createMany({
      data: questions.map((q) => {
        let options = [q.answer, q.option1, q.option2, q.option3];
        options = options.sort(() => Math.random() - 0.5);
        return {
          question: q.question,
          answer: q.answer,
          options: JSON.stringify(options),
          chapterId: chapterId,
        };
      }),
    });

    await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        videoId: videoId,
        summary: summary,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
        },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "unkown",
        },
        {
          status: 500,
        }
      );
    }
  }
}
