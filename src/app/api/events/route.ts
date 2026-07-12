import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events, categories, posts } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      startDate: events.startDate,
      endDate: events.endDate,
      budget: events.budget,
      status: events.status,
      customFields: events.customFields,
      categoryId: events.categoryId,
      categoryLabel: categories.label,
      categoryColor: categories.color,
      createdAt: events.createdAt,
      postCount: sql<number>`(SELECT COUNT(*) FROM posts WHERE posts.event_id = ${events.id})::int`,
    })
    .from(events)
    .leftJoin(categories, eq(events.categoryId, categories.id))
    .where(eq(events.companyId, session.companyId))
    .orderBy(desc(events.startDate));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, startDate, endDate, budget, status, categoryId, customFields } = body;

  if (!title || !startDate || !endDate) {
    return NextResponse.json({ error: "Title, start date, and end date are required" }, { status: 400 });
  }

  const [event] = await db.insert(events).values({
    companyId: session.companyId,
    title,
    description: description || null,
    startDate,
    endDate,
    budget: budget ? parseInt(budget) : null,
    status: status || "draft",
    categoryId: categoryId || null,
    customFields: customFields || {},
  }).returning();

  return NextResponse.json(event, { status: 201 });
}
