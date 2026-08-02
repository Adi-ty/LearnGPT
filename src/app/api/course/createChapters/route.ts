import { NextResponse } from "next/server";
import { createChapterSchema } from "@/validators/course";
import { ZodError } from "zod";
import { generateCourseUnits, generateImageSearchTerm } from "@/lib/ai";
import { getUnsplashImage } from "@/lib/unsplash";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { checkSubscription } from "@/lib/subscription";

export async function POST(req: Request, res: Response) {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const isPro = await checkSubscription();
        if (session.user.credits <= 0 && !isPro) {
            return new NextResponse("No Credits", { status: 402 });
        }

        const body = await req.json();
        const { title, units } = createChapterSchema.parse(body);

        const output_units = await generateCourseUnits(title, units);

        const image_search_term = await generateImageSearchTerm(title);

        const course_image = await getUnsplashImage(image_search_term);

        const course = await prisma.course.create({
            data: {
                name: title,
                image: course_image,
            },
        });

        for (const unit of output_units) {
            const title = unit.title;
            const prismaUnit = await prisma.unit.create({
                data: {
                    name: title,
                    courseId: course.id,
                },
            });
            await prisma.chapter.createMany({
                data: unit.chapters.map((chapter) => {
                    return {
                        name: chapter.chapter_title,
                        youtubeSearchQuery: chapter.youtube_search_query,
                        unitId: prismaUnit.id,
                    };
                }),
            });
        }

        await prisma.user.update({
            where: {
                id: session.user.id,
            },
            data: {
                credits: {
                    decrement: 1,
                },
            },
        });

        return NextResponse.json({ course_id: course.id });
    } catch (err) {
        if (err instanceof ZodError) {
            return new NextResponse("Invalid Body", { status: 400 });
        }
        console.error(err);
        return new NextResponse("Failed to create course", { status: 500 });
    }
}
