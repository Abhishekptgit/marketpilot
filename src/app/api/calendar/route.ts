import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts, events, categories } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "from and to query params are required" }, { status: 400 });
  }

  const result = await db
    .select({
      id: posts.id,
      title: posts.title,
      caption: posts.caption,
      platform: posts.platform,
      scheduledDate: posts.scheduledDate,
      scheduledTime: posts.scheduledTime,
      status: posts.status,
      imageUrl: posts.imageUrl,
      eventId: posts.eventId,
      eventTitle: events.title,
      eventStatus: events.status,
      categoryLabel: categories.label,
      categoryColor: categories.color,
    })
    .from(posts)
    .innerJoin(events, eq(posts.eventId, events.id))
    .leftJoin(categories, eq(events.categoryId, categories.id))
    .where(
      and(
        eq(events.companyId, session.companyId),
        gte(posts.scheduledDate, from),
        lte(posts.scheduledDate, to)
      )
    )
    .orderBy(posts.scheduledDate, posts.scheduledTime);

  return NextResponse.json(result);
}
