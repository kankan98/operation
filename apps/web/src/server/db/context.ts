import { z } from "zod";

import { DataFoundationError } from "./errors";

export const teamRoleSchema = z.enum([
  "operator",
  "host",
  "product_owner",
  "reviewer",
  "admin",
  "viewer",
]);

export const dataAccessContextSchema = z.object({
  requestId: z.string().min(1),
  actorId: z.string().min(1),
  tenantId: z.string().min(1),
  teamId: z.string().min(1),
  role: teamRoleSchema,
  permissions: z.array(z.string().min(1)).default([]),
});

export type DataAccessContext = z.infer<typeof dataAccessContextSchema>;

export const paginationSchema = z.object({
  cursor: z.string().min(1).nullable().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export type DataPagination = z.infer<typeof paginationSchema>;

export function parseDataAccessContext(input: unknown): DataAccessContext {
  const parsed = dataAccessContextSchema.safeParse(input);

  if (parsed.success) {
    return parsed.data;
  }

  throw new DataFoundationError("VALIDATION_FAILED", "Invalid data access context", {
    details: {
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    },
  });
}

export function assertTenantTeamScope(
  context: DataAccessContext,
  scope: {
    tenantId: string;
    teamId: string;
  },
) {
  if (context.tenantId !== scope.tenantId || context.teamId !== scope.teamId) {
    throw new DataFoundationError(
      "TENANT_SCOPE_MISMATCH",
      "Repository scope does not match authorized tenant/team",
      {
        details: {
          requestId: context.requestId,
        },
      },
    );
  }
}
