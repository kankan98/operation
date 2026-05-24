import { createDatabaseConnection } from "@/server/db/client";
import {
  handleOperatorV0SessionRoute,
  isOperatorV0BootstrapEnabled,
  OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_NAME,
  OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_VALUE,
} from "@/server/auth/operator-v0";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const enabled = isOperatorV0BootstrapEnabled();
  const hasValidCsrfHeader =
    request.headers.get(OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_NAME) ===
    OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_VALUE;

  if (!enabled || !hasValidCsrfHeader) {
    return handleOperatorV0SessionRoute(null, request, { enabled });
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleOperatorV0SessionRoute(db, request, { enabled });
  } finally {
    await client.end();
  }
}
