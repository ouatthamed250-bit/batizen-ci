import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as typeof globalThis & {
  __batizenCiPostgresqlPool?: Pool;
};

function getValidatedDatabaseUrl(): string | null {
  const raw = process.env.DATABASE_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
      console.error("[BÂTIZEN] DATABASE_URL must use postgresql:// protocol");
      return null;
    }
    return raw;
  } catch {
    console.error("[BÂTIZEN] DATABASE_URL is not a valid URL");
    return null;
  }
}

const databaseUrl = getValidatedDatabaseUrl();

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

if (databaseUrl) {
  pool = globalForDb.__batizenCiPostgresqlPool ?? new Pool({ connectionString: databaseUrl });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__batizenCiPostgresqlPool = pool;
  }

  db = drizzle(pool, { schema });
}

export { db, pool };
