import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { createDatabaseConnection } from "@/server/db/client";
import { createTalkTrackAssetRepository } from "@/server/talk-tracks/repository";
import {
  handleTalkTrackAssetRestoreRoute,
  TALK_TRACK_ASSET_MUTATION_CSRF_HEADER_NAME,
  TALK_TRACK_ASSET_MUTATION_CSRF_HEADER_VALUE,
} from "@/server/talk-tracks/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TalkTrackAssetRouteContext = {
  params: Promise<{
    assetId?: string;
  }>;
};

export async function POST(
  request: Request,
  context: TalkTrackAssetRouteContext,
): Promise<Response> {
  const params = await context.params;
  const hasValidCsrfHeader =
    request.headers.get(TALK_TRACK_ASSET_MUTATION_CSRF_HEADER_NAME) ===
    TALK_TRACK_ASSET_MUTATION_CSRF_HEADER_VALUE;

  if (
    !hasValidCsrfHeader ||
    !readAuthSessionReferenceFromRequestCookie(request)
  ) {
    return handleTalkTrackAssetRestoreRoute(null, null, request, params);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleTalkTrackAssetRestoreRoute(
      createAuthSessionRepository(db),
      createTalkTrackAssetRepository(db),
      request,
      params,
    );
  } finally {
    await client.end();
  }
}
