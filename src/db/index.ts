import type { NeonQueryFunction } from "@neondatabase/serverless";
import type { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL!;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const isNeon =
  databaseUrl.includes("neon.tech") ||
  databaseUrl.includes("neon.") ||
  !databaseUrl.includes("127.0.0.1");

let _db: ReturnType<typeof import("drizzle-orm/neon-http").drizzle> | ReturnType<typeof import("drizzle-orm/node-postgres").drizzle>;

if (isNeon) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { neon } = require("@neondatabase/serverless") as typeof import("@neondatabase/serverless");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require("drizzle-orm/neon-http") as typeof import("drizzle-orm/neon-http");
  const sql: NeonQueryFunction<false, false> = neon(databaseUrl);
  _db = drizzle({ client: sql });
} else {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pgModule = require("pg") as typeof import("pg");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require("drizzle-orm/node-postgres") as typeof import("drizzle-orm/node-postgres");

  const globalForDb = globalThis as typeof globalThis & { __pool?: Pool };
  const pool = globalForDb.__pool ?? new pgModule.Pool({ connectionString: databaseUrl, max: 5 });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__pool = pool;
  }
  _db = drizzle(pool);
}

export const db = _db;
