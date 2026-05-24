import { z } from "zod";

import { DataFoundationError } from "./errors";

const databaseUrlSchema = z
  .string()
  .min(1)
  .refine((value) => value.startsWith("postgres://") || value.startsWith("postgresql://"), {
    message: "DATABASE_URL must use a postgres:// or postgresql:// URL",
  });

export const databaseEnvSchema = z.object({
  DATABASE_URL: databaseUrlSchema,
  DATABASE_MAX_CONNECTIONS: z.coerce.number().int().min(1).max(20).optional(),
});

export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;

export function parseDatabaseEnv(env: NodeJS.ProcessEnv = process.env): DatabaseEnv {
  const parsed = databaseEnvSchema.safeParse(env);

  if (parsed.success) {
    return parsed.data;
  }

  const missingDatabaseUrl = parsed.error.issues.some(
    (issue) => issue.path.join(".") === "DATABASE_URL",
  );

  throw new DataFoundationError(
    missingDatabaseUrl ? "DATABASE_URL_REQUIRED" : "DATABASE_ENV_INVALID",
    missingDatabaseUrl
      ? "DATABASE_URL is required for local data foundation commands"
      : "Database environment variables are invalid",
    {
      details: {
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    },
  );
}
