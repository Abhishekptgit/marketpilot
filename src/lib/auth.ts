import { db } from "@/db";
import { sessions, users, companies } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { cookies } from "next/headers";

const SESSION_COOKIE = "session_token";

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const result = await db
      .select({
        userId: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        companyId: companies.id,
        companyName: companies.name,
        companyIndustry: companies.industry,
        companyLogo: companies.logo,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .innerJoin(companies, eq(users.companyId, companies.id))
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
      .limit(1);

    if (result.length === 0) return null;
    return result[0];
  } catch (error) {
    console.error("Session check failed:", error);
    return null;
  }
}

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getSession>>>;
