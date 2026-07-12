import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { label, color, sortOrder } = await req.json();

  const [updated] = await db
    .update(categories)
    .set({
      ...(label !== undefined && { label }),
      ...(color !== undefined && { color }),
      ...(sortOrder !== undefined && { sortOrder }),
    })
    .where(and(eq(categories.id, id), eq(categories.companyId, session.companyId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.delete(categories).where(and(eq(categories.id, id), eq(categories.companyId, session.companyId)));
  return NextResponse.json({ success: true });
}
