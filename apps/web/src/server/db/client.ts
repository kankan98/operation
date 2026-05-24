import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { parseDatabaseEnv } from "./env";
import * as schema from "./schema";

export function createDatabaseConnection(env: NodeJS.ProcessEnv = process.env) {
  const databaseEnv = parseDatabaseEnv(env);
  const client = postgres(databaseEnv.DATABASE_URL, {
    max: databaseEnv.DATABASE_MAX_CONNECTIONS ?? 5,
    prepare: false,
  });
  const db = drizzle(client, { schema });

  return {
    client,
    db,
  };
}

export type DatabaseConnection = ReturnType<typeof createDatabaseConnection>;
export type DatabaseClient = DatabaseConnection["db"];
