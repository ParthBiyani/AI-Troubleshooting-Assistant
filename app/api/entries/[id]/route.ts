import { NextResponse } from "next/server";
import { getEntry } from "@/lib/kb/load";

export const runtime = "nodejs";

/**
 * Returns one knowledge base entry as written in the manual. Saved chats keep only a slim copy
 * of each source, so the full text is fetched when a source card is opened again.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = /^KB-[A-Z]+-\d{3}$/.test(id) ? getEntry(id) : undefined;
  if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  return NextResponse.json(
    { id: entry.id, markdown: entry.markdown },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
