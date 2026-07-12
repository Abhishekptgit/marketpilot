import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const isNeon = databaseUrl.includes("neon.tech");

function createDb() {
  if (isNeon) {
    const sql = neon(databaseUrl!);
    return drizzleHttp({ client: sql });
  }

  const globalForDb = globalThis as typeof globalThis & {
    __pool?: Pool;
  };

  const pool =
    globalForDb.__pool ??
    new Pool({
      connectionString: databaseUrl,
      max: 5,
    });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__pool = pool;
  }

  return drizzlePg(pool);
}

export const db = createDb();
