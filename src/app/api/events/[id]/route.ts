import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events, categories } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
    .where(and(eq(events.id, id), eq(events.companyId, session.companyId)))
    .limit(1);

  if (result.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result[0]);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, startDate, endDate, budget, status, categoryId, customFields } = body;

  const [updated] = await db
    .update(events)
    .set({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(startDate !== undefined && { startDate }),
      ...(endDate !== undefined && { endDate }),
      ...(budget !== undefined && { budget: budget ? parseInt(budget) : null }),
      ...(status !== undefined && { status }),
      ...(categoryId !== undefined && { categoryId: categoryId || null }),
      ...(customFields !== undefined && { customFields }),
    })
    .where(and(eq(events.id, id), eq(events.companyId, session.companyId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.delete(events).where(and(eq(events.id, id), eq(events.companyId, session.companyId)));
  return NextResponse.json({ success: true });
}
