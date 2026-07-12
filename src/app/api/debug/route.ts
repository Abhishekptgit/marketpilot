import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const steps: string[] = [];
  try {
    const dbUrl = process.env.DATABASE_URL || "NOT SET";
    const masked = dbUrl.replace(/:[^@]+@/, ":***@");
    steps.push("DATABASE_URL: " + masked);

    steps.push("Importing neon driver...");
    steps.push("Creating db client...");

    steps.push("Running test query...");
    const result = await db.select().from(users);
    steps.push("Query success! Users: " + result.length);

    return NextResponse.json({
      status: "ok",
      steps,
      userCount: result.length,
      emails: result.map((u) => u.email),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack?.split("\n").slice(0, 8) : [];
    steps.push("ERROR: " + message);
    return NextResponse.json(
      { status: "error", steps, error: message, stack },
      { status: 500 }
    );
  }
}
