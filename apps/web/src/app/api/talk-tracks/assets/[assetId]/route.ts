import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { createDatabaseConnection } from "@/server/db/client";
import { createTalkTrackAssetRepository } from "@/server/talk-tracks/repository";
import { handleTalkTrackAssetDetailRoute } from "@/server/talk-tracks/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TalkTrackAssetRouteContext = {
  params: Promise<{
    assetId?: string;
  }>;
};

export async function GET(
  request: Request,
  context: TalkTrackAssetRouteContext,
): Promise<Response> {
  const params = await context.params;

  if (!readAuthSessionReferenceFromRequestCookie(request)) {
    return handleTalkTrackAssetDetailRoute(null, null, request, params);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleTalkTrackAssetDetailRoute(
      createAuthSessionRepository(db),
      createTalkTrackAssetRepository(db),
      request,
      params,
    );
  } finally {
    await client.end();
  }
}
