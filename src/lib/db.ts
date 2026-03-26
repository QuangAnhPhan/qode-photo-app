import { Pool } from "pg";

declare global {
  var pgPool: Pool | undefined;
}

export function getPool() {
  if (global.pgPool) {
    return global.pgPool;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  const pool = new Pool({
    connectionString,
  });

  global.pgPool = pool;

  return pool;
}
