import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shareLinks, events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await req.json();
  if (!eventId) return NextResponse.json({ error: "eventId is required" }, { status: 400 });

  // Verify event belongs to company
  const eventResult = await db.select().from(events)
    .where(and(eq(events.id, eventId), eq(events.companyId, session.companyId)))
    .limit(1);
  if (eventResult.length === 0) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  // Check if a share link already exists
  const existing = await db.select().from(shareLinks)
    .where(eq(shareLinks.eventId, eventId))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(existing[0]);
  }

  const token = uuidv4();
  const [link] = await db.insert(shareLinks).values({
    companyId: session.companyId,
    eventId,
    token,
  }).returning();

  return NextResponse.json(link, { status: 201 });
}
