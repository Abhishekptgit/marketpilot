import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db
    .select()
    .from(categories)
    .where(eq(categories.companyId, session.companyId))
    .orderBy(asc(categories.sortOrder));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { label, color } = await req.json();
  if (!label) return NextResponse.json({ error: "Label is required" }, { status: 400 });

  const [cat] = await db.insert(categories).values({
    companyId: session.companyId,
    label,
    color: color || "#6366f1",
    sortOrder: 99,
  }).returning();

  return NextResponse.json(cat, { status: 201 });
}
