import { NextResponse } from "next/server";

export async function POST(req: Request, res: Response) {
  try {
    return NextResponse.json({ message: "Hello, World!" });
  } catch (err) {}
}
