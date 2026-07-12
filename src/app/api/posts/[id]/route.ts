import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts, events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, caption, platform, scheduledDate, scheduledTime, status, imageUrl } = body;

  // Verify post belongs to company
  const postResult = await db
    .select({ postId: posts.id })
    .from(posts)
    .innerJoin(events, eq(posts.eventId, events.id))
    .where(and(eq(posts.id, id), eq(events.companyId, session.companyId)))
    .limit(1);

  if (postResult.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [updated] = await db
    .update(posts)
    .set({
      ...(title !== undefined && { title }),
      ...(caption !== undefined && { caption }),
      ...(platform !== undefined && { platform }),
      ...(scheduledDate !== undefined && { scheduledDate }),
      ...(scheduledTime !== undefined && { scheduledTime: scheduledTime || null }),
      ...(status !== undefined && { status }),
      ...(imageUrl !== undefined && { imageUrl }),
    })
    .where(eq(posts.id, id))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify post belongs to company
  const postResult = await db
    .select({ postId: posts.id })
    .from(posts)
    .innerJoin(events, eq(posts.eventId, events.id))
    .where(and(eq(posts.id, id), eq(events.companyId, session.companyId)))
    .limit(1);

  if (postResult.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(posts).where(eq(posts.id, id));
  return NextResponse.json({ success: true });
}
