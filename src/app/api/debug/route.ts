import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL || "NOT SET";
    const masked = dbUrl.replace(/:[^@]+@/, ":***@");

    // Test DB query
    const result = await db.select().from(users);

    return NextResponse.json({
      status: "ok",
      database: masked,
      isNeon: dbUrl.includes("neon.tech"),
      userCount: result.length,
      emails: result.map((u) => u.email),
      nodeEnv: process.env.NODE_ENV,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : "";
    return NextResponse.json(
      {
        status: "error",
        error: message,
        stack: stack?.split("\n").slice(0, 5),
        database: (process.env.DATABASE_URL || "NOT SET").replace(/:[^@]+@/, ":***@"),
      },
      { status: 500 }
    );
  }
}
