import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shareLinks, events, posts, categories, companies, postComments } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const linkResult = await db
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.token, token))
    .limit(1);

  if (linkResult.length === 0) {
    return NextResponse.json({ error: "Invalid share link" }, { status: 404 });
  }

  const link = linkResult[0];

  // Get event with category
  const eventResult = await db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      startDate: events.startDate,
      endDate: events.endDate,
      status: events.status,
      categoryLabel: categories.label,
      categoryColor: categories.color,
      companyName: companies.name,
      companyLogo: companies.logo,
    })
    .from(events)
    .leftJoin(categories, eq(events.categoryId, categories.id))
    .innerJoin(companies, eq(events.companyId, companies.id))
    .where(eq(events.id, link.eventId!))
    .limit(1);

  if (eventResult.length === 0) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Get posts
  const postsResult = await db
    .select()
    .from(posts)
    .where(eq(posts.eventId, link.eventId!))
    .orderBy(posts.scheduledDate);

  // Get comments for these posts
  const postIds = postsResult.map(p => p.id);
  let commentsResult: Array<{
    id: string;
    postId: string;
    authorName: string;
    content: string;
    isApproval: boolean;
    createdAt: Date;
  }> = [];
  if (postIds.length > 0) {
    commentsResult = await db
      .select()
      .from(postComments)
      .where(sql`${postComments.postId} = ANY(${postIds})`);
  }

  return NextResponse.json({
    event: eventResult[0],
    posts: postsResult,
    comments: commentsResult,
  });
}
