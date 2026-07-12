import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { companies, users, sessions, categories } from "@/db/schema";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { INDUSTRIES } from "@/lib/industry-templates";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, companyName, industry } = await req.json();

    if (!email || !password || !name || !companyName) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Check if user exists
    const existing = await db.select().from(users).where(
      (await import("drizzle-orm")).eq(users.email, email)
    ).limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const selectedIndustry = industry || "Other";

    // Create company
    const [company] = await db.insert(companies).values({
      name: companyName,
      industry: selectedIndustry,
    }).returning();

    // Create user
    const [user] = await db.insert(users).values({
      email,
      passwordHash,
      name,
      companyId: company.id,
      role: "owner",
    }).returning();

    // Create industry starter categories
    const template = INDUSTRIES[selectedIndustry] || INDUSTRIES["Other"];
    if (template) {
      const catValues = template.categories.map((c, i) => ({
        companyId: company.id,
        label: c.label,
        color: c.color,
        sortOrder: i,
      }));
      if (catValues.length > 0) {
        await db.insert(categories).values(catValues);
      }
    }

    // Create session
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await db.insert(sessions).values({ userId: user.id, token, expiresAt });

    const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Signup error:", message, error);
    return NextResponse.json({ error: process.env.NODE_ENV === "production" ? "Internal server error" : message }, { status: 500 });
  }
}
