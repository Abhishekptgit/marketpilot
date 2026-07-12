import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shareLinks, postComments, posts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Verify token
  const linkResult = await db.select().from(shareLinks).where(eq(shareLinks.token, token)).limit(1);
  if (linkResult.length === 0) {
    return NextResponse.json({ error: "Invalid share link" }, { status: 404 });
  }

  const { postId, authorName, content, isApproval } = await req.json();
  if (!postId || !content) {
    return NextResponse.json({ error: "postId and content are required" }, { status: 400 });
  }

  // Verify post belongs to this event
  const postResult = await db.select().from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (postResult.length === 0 || postResult[0].eventId !== linkResult[0].eventId) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // If approval, update post status
  if (isApproval) {
    await db.update(posts).set({ status: "approved" }).where(eq(posts.id, postId));
  }

  const [comment] = await db.insert(postComments).values({
    postId,
    authorName: authorName || "Client",
    content,
    isApproval: isApproval || false,
  }).returning();

  return NextResponse.json(comment, { status: 201 });
}
