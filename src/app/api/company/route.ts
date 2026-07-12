import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db.select().from(companies).where(eq(companies.id, session.companyId)).limit(1);
  if (result.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(result[0]);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, logo, industry } = await req.json();

  const [updated] = await db
    .update(companies)
    .set({
      ...(name !== undefined && { name }),
      ...(logo !== undefined && { logo }),
      ...(industry !== undefined && { industry }),
    })
    .where(eq(companies.id, session.companyId))
    .returning();

  return NextResponse.json(updated);
}
