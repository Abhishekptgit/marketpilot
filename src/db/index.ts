import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

// Clean the connection string — remove params that pg driver doesn't handle well
function cleanConnectionString(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove channel_binding as pg driver doesn't support it natively
    parsed.searchParams.delete("channel_binding");
    return parsed.toString();
  } catch {
    // If URL parsing fails, do string replacement
    return url
      .replace(/[&?]channel_binding=[^&]*/g, "")
      .replace(/\?&/, "?");
  }
}

const cleanUrl = cleanConnectionString(databaseUrl);

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
    max: 5,
    connectionTimeoutMillis: 10000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
