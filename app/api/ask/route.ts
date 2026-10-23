import { NextResponse } from "next/server";
import { z } from "zod";
import { RateLimiter } from "@/lib/cache";
import { MAX_QUESTION_CHARS, ask } from "@/lib/pipeline";

export const runtime = "nodejs";
export const maxDuration = 60;

const limiter = new RateLimiter(10, 60_000);

const bodySchema = z.object({
  question: z.string().trim().min(2).max(MAX_QUESTION_CHARS),
  previousQuestion: z.string().max(MAX_QUESTION_CHARS).optional(),
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!limiter.allow(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: `Send a question between 2 and ${MAX_QUESTION_CHARS} characters.` },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await ask(parsed.data));
  } catch (err) {
    console.error("ask failed", err);
    return NextResponse.json(
      { error: "Something went wrong while searching the knowledge base." },
      { status: 500 },
    );
  }
}
