import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts, events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const eventId = req.nextUrl.searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "eventId is required" }, { status: 400 });

  // Verify event belongs to company
  const eventResult = await db.select().from(events)
    .where(and(eq(events.id, eventId), eq(events.companyId, session.companyId)))
    .limit(1);
  if (eventResult.length === 0) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const result = await db.select().from(posts).where(eq(posts.eventId, eventId)).orderBy(posts.scheduledDate);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { eventId, title, caption, platform, scheduledDate, scheduledTime, status, imageUrl } = body;

  if (!eventId || !title || !scheduledDate) {
    return NextResponse.json({ error: "eventId, title, and scheduledDate are required" }, { status: 400 });
  }

  // Verify event belongs to company
  const eventResult = await db.select().from(events)
    .where(and(eq(events.id, eventId), eq(events.companyId, session.companyId)))
    .limit(1);
  if (eventResult.length === 0) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const [post] = await db.insert(posts).values({
    eventId,
    title,
    caption: caption || null,
    platform: platform || "Instagram",
    scheduledDate,
    scheduledTime: scheduledTime || null,
    status: status || "draft",
    imageUrl: imageUrl || null,
    createdBy: session.userId,
  }).returning();

  return NextResponse.json(post, { status: 201 });
}
