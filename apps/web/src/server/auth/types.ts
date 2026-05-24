import { z } from "zod";

export const authPermissionSchema = z.enum([
  "read_workspace",
  "manage_products",
  "capture_session",
  "review_knowledge",
  "run_ai_review",
  "ask_qa",
  "manage_talk_tracks",
  "manage_next_tasks",
  "manage_members",
  "export_data",
  "admin_settings",
]);

export const authTeamRoleSchema = z.enum([
  "operator",
  "host",
  "product_owner",
  "reviewer",
  "admin",
  "viewer",
]);

export const authTenantRoleSchema = z.enum([
  "owner",
  "admin",
  "member",
  "viewer",
]);

export const authGuardTargetSchema = z.object({
  tenantId: z.string().min(1),
  teamId: z.string().min(1),
  type: z.string().min(1).max(80),
  id: z.string().min(1).optional(),
});

export const authGuardRequestSchema = z.object({
  requestId: z.string().min(1),
  actorId: z.string().min(1),
  tenantId: z.string().min(1),
  teamId: z.string().min(1),
  requiredPermission: authPermissionSchema,
  allowedRoles: z.array(authTeamRoleSchema).optional(),
  target: authGuardTargetSchema.optional(),
});

export type AuthPermission = z.infer<typeof authPermissionSchema>;
export type AuthTeamRole = z.infer<typeof authTeamRoleSchema>;
export type AuthTenantRole = z.infer<typeof authTenantRoleSchema>;
export type AuthGuardTarget = z.infer<typeof authGuardTargetSchema>;
export type AuthGuardRequest = z.infer<typeof authGuardRequestSchema>;

export type AuthContext = {
  requestId: string;
  actor: {
    id: string;
    displayName: string;
  };
  tenant: {
    id: string;
    name: string;
  };
  team: {
    id: string;
    name: string;
  };
  tenantMembershipId: string;
  teamMembershipId: string;
  tenantRole: AuthTenantRole;
  role: AuthTeamRole;
  permissions: AuthPermission[];
  createdAt: Date;
};

export type AuthorizationDecision = {
  allowed: boolean;
  code: AuthGuardErrorCode;
  requestId: string;
  retryable: boolean;
  userMessage: string;
  details?: Record<string, unknown>;
};

export type AuthGuardErrorCode =
  | "AUTH_CONTEXT_INVALID"
  | "UNAUTHENTICATED"
  | "SESSION_EXPIRED"
  | "SESSION_REVOKED"
  | "TENANT_NOT_FOUND"
  | "TEAM_NOT_FOUND"
  | "MEMBERSHIP_INACTIVE"
  | "FORBIDDEN_PERMISSION"
  | "FORBIDDEN_ROLE"
  | "FORBIDDEN_SCOPE"
  | "AUTH_OPERATION_FAILED";
