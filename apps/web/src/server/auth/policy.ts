import type { AuthPermission, AuthTeamRole } from "./types";

export const ROLE_PERMISSIONS: Record<AuthTeamRole, AuthPermission[]> = {
  viewer: ["read_workspace"],
  host: ["read_workspace", "ask_qa", "manage_talk_tracks"],
  operator: [
    "read_workspace",
    "capture_session",
    "ask_qa",
    "manage_next_tasks",
  ],
  product_owner: [
    "read_workspace",
    "manage_products",
    "ask_qa",
    "manage_talk_tracks",
  ],
  reviewer: [
    "read_workspace",
    "review_knowledge",
    "run_ai_review",
    "ask_qa",
    "manage_talk_tracks",
    "manage_next_tasks",
  ],
  admin: [
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
  ],
};

export function getPermissionsForRole(
  role: AuthTeamRole,
  overrides: string[] = [],
): AuthPermission[] {
  const permissionSet = new Set<AuthPermission>(ROLE_PERMISSIONS[role]);

  for (const override of overrides) {
    if (isAuthPermission(override)) {
      permissionSet.add(override);
    }
  }

  return [...permissionSet];
}

export function isAuthPermission(value: string): value is AuthPermission {
  return Object.values(ROLE_PERMISSIONS).some((permissions) =>
    permissions.includes(value as AuthPermission),
  );
}
