export {
  AuthGuardError,
  redactAuthMetadata,
  toAuthGuardError,
  toAuthorizationDecision,
  userMessageForCode,
} from "./errors";
export {
  authContextToDataAccessContext,
  createAuthGuard,
  requireAuthContext,
  requireAuthorizedDataAccess,
  type AuthGuardRepository,
} from "./guard";
export {
  getPermissionsForRole,
  isAuthPermission,
  ROLE_PERMISSIONS,
} from "./policy";
export {
  createAuthGuardRepository,
  type AuthRepositoryDatabase,
} from "./repository";
export {
  createAuthSessionClearCookieHeader,
  createAuthSessionSetCookieHeader,
  invalidateAuthSessionFromRequestCookie,
  readAuthSessionReferenceFromCookieHeader,
  readAuthSessionReferenceFromRequestCookie,
  resolveAuthContextFromRequestCookie,
  type AuthCookieInvalidationRequest,
  type AuthCookieInvalidationResult,
  type AuthCookieRequestLike,
  type AuthCookieResolveRequest,
} from "./cookie";
export {
  authSessionCookieName,
  authSessionCookieOptions,
  authSessionMaxAgeSeconds,
  createAuthSessionReference,
  createAuthSessionRepository,
  hashAuthSessionReference,
  invalidateAuthSessionByReference,
  requireAuthContextFromSession,
  type AuthSessionInvalidateRequest,
  type AuthSessionInvalidationReason,
  type AuthSessionInvalidationResult,
  type AuthSessionRepository,
  type AuthSessionRepositoryDatabase,
  type AuthSessionResolveRequest,
  type AuthSessionResolution,
  type AuthSessionSummary,
} from "./session";
export {
  AUTH_LOGOUT_CSRF_HEADER_NAME,
  AUTH_LOGOUT_CSRF_HEADER_VALUE,
  AUTH_TEAM_ID_HEADER_NAME,
  AUTH_TENANT_ID_HEADER_NAME,
  handleAuthLogoutRoute,
  handleAuthSessionRoute,
} from "./route";
export {
  authGuardRequestSchema,
  authGuardTargetSchema,
  authPermissionSchema,
  authTeamRoleSchema,
  authTenantRoleSchema,
  type AuthContext,
  type AuthGuardErrorCode,
  type AuthGuardRequest,
  type AuthGuardTarget,
  type AuthPermission,
  type AuthorizationDecision,
  type AuthTeamRole,
  type AuthTenantRole,
} from "./types";
