import { createDatabaseConnection } from "../db/client";
import {
  appUsers,
  authSessions,
  teamMemberships,
  teams,
  tenantMemberships,
  tenants,
} from "../db/schema";
import {
  authSessionCookieName,
  createAuthSessionReference,
  createAuthSessionRepository,
  hashAuthSessionReference,
  type AuthSessionRepositoryDatabase,
} from "../auth";
import {
  handleRacketProductPublishRoute,
  handleRacketProductSourceCreateRoute,
  handleRacketProductSubmitRoute,
  handleRacketProductsListRoute,
  handleRacketProductsCreateRoute,
  handleRacketReviewDecisionRoute,
  handleRacketReviewQueueRoute,
  RACKET_PRODUCT_MUTATION_CSRF_HEADER_NAME,
  RACKET_PRODUCT_MUTATION_CSRF_HEADER_VALUE,
} from "./route";
import {
  createRacketProductRepository,
  type RacketProductRepositoryDatabase,
} from "./repository";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local racket product route check");
  }
}

type JsonObject = Record<string, unknown>;

function scopedApiUrl(path: string, tenantId: string, teamId: string): string {
  const separator = path.includes("?") ? "&" : "?";

  return `https://operation.local${path}${separator}tenantId=${tenantId}&teamId=${teamId}`;
}

function scopedProductsUrl(tenantId: string, teamId: string): string {
  return scopedApiUrl("/api/rackets/products", tenantId, teamId);
}

function requestWithCookie(url: string, sessionReference: string): Request {
  return new Request(url, {
    headers: {
      cookie: `${authSessionCookieName}=${encodeURIComponent(sessionReference)}`,
    },
  });
}

function productInput(model: string, aliases: string[] = []) {
  return {
    brand: "Yonex",
    series: "Astrox",
    model,
    aliases: aliases.map((alias) => ({
      alias,
      aliasType: "official_en",
      confidence: "high",
    })),
    specs: {
      weightClasses: ["4U", "3U"],
      balancePoint: "",
      balanceType: "head_heavy",
      shaftStiffness: "extra stiff",
      recommendedTension: "20-28 lb",
    },
    positioning: {
      playerLevels: ["advanced"],
      playStyles: ["rear-court attack"],
      priceBand: "premium",
      sellingFocus: ["Fast recovery after a steep smash"],
      limitations: ["Requires stronger swing timing"],
    },
    sourceIds: [],
  };
}

function createRequest(input: {
  url: string;
  sessionReference?: string;
  csrf?: boolean;
  body?: unknown;
}): Request {
  const headers = new Headers({
    "content-type": "application/json",
  });

  if (input.sessionReference) {
    headers.set(
      "cookie",
      `${authSessionCookieName}=${encodeURIComponent(input.sessionReference)}`,
    );
  }

  if (input.csrf) {
    headers.set(
      RACKET_PRODUCT_MUTATION_CSRF_HEADER_NAME,
      RACKET_PRODUCT_MUTATION_CSRF_HEADER_VALUE,
    );
  }

  return new Request(input.url, {
    method: "POST",
    headers,
    body: JSON.stringify(input.body ?? productInput("Astrox 100 ZZ")),
  });
}

function mutationRequest(input: {
  url: string;
  sessionReference?: string;
  csrf?: boolean;
  body?: unknown;
}): Request {
  return createRequest(input);
}

function sourceInput(productId: string, titleSuffix = "") {
  return {
    productId,
    sourceType: "official_site",
    title: `Yonex official source${titleSuffix}`,
    url: `https://www.yonex.com/example/astrox${titleSuffix}`,
    retrievedAt: "2026-05-25T08:00:00.000Z",
    trustLevel: "official",
    refreshPolicy: "quarterly",
  };
}

async function readJson(response: Response): Promise<JsonObject> {
  const body = await response.json();

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Racket product route response was not a JSON object");
  }

  return body as JsonObject;
}

function expectNoStore(label: string, response: Response) {
  if (response.headers.get("cache-control") !== "no-store") {
    throw new Error(`${label} did not return Cache-Control: no-store`);
  }
}

function expectNoSensitive(label: string, value: unknown) {
  const serialized = JSON.stringify(value);

  for (const leaked of [
    "raw_cookie_value",
    "raw_session_secret",
    "provider_session_raw",
    "postgres://operation:operation_dev_password@",
    "other_team_hidden_product",
    "Bearer",
  ]) {
    if (serialized.includes(leaked)) {
      throw new Error(`${label} leaked sensitive metadata`);
    }
  }
}

async function main() {
  const { client, db } = createDatabaseConnection();
  const checkId = `rackets_route_check_${Date.now()}`;

  try {
    try {
      await db.transaction(async (transaction) => {
        const tenantId = `${checkId}_tenant`;
        const teamId = `${checkId}_team`;
        const otherTeamId = `${checkId}_other_team`;
        const managerId = `${checkId}_manager`;
        const reviewerId = `${checkId}_reviewer`;
        const viewerId = `${checkId}_viewer`;
        const managerReference = createAuthSessionReference();
        const reviewerReference = createAuthSessionReference();
        const viewerReference = createAuthSessionReference();
        const now = new Date();
        const future = new Date(Date.now() + 60 * 60 * 1000);

        await transaction.insert(tenants).values({
          id: tenantId,
          name: "Local racket product route check",
          defaultTeamId: teamId,
        });

        await transaction.insert(teams).values([
          {
            id: teamId,
            tenantId,
            name: "Product operations",
            createdBy: managerId,
          },
          {
            id: otherTeamId,
            tenantId,
            name: "Other product team",
            createdBy: managerId,
          },
        ]);

        await transaction.insert(appUsers).values([
          {
            id: managerId,
            displayName: "Product Manager",
            primaryEmail: `${managerId}@example.invalid`,
            status: "active",
          },
          {
            id: reviewerId,
            displayName: "Reviewer",
            primaryEmail: `${reviewerId}@example.invalid`,
            status: "active",
          },
          {
            id: viewerId,
            displayName: "Viewer",
            primaryEmail: `${viewerId}@example.invalid`,
            status: "active",
          },
        ]);

        await transaction.insert(tenantMemberships).values([
          {
            id: `${managerId}_tenant_membership`,
            tenantId,
            userId: managerId,
            status: "active",
            tenantRole: "member",
            joinedAt: now,
          },
          {
            id: `${reviewerId}_tenant_membership`,
            tenantId,
            userId: reviewerId,
            status: "active",
            tenantRole: "member",
            joinedAt: now,
          },
          {
            id: `${viewerId}_tenant_membership`,
            tenantId,
            userId: viewerId,
            status: "active",
            tenantRole: "viewer",
            joinedAt: now,
          },
        ]);

        await transaction.insert(teamMemberships).values([
          {
            id: `${managerId}_team_membership`,
            tenantId,
            teamId,
            userId: managerId,
            status: "active",
            role: "product_owner",
            joinedAt: now,
          },
          {
            id: `${managerId}_other_team_membership`,
            tenantId,
            teamId: otherTeamId,
            userId: managerId,
            status: "active",
            role: "product_owner",
            joinedAt: now,
          },
          {
            id: `${reviewerId}_team_membership`,
            tenantId,
            teamId,
            userId: reviewerId,
            status: "active",
            role: "reviewer",
            joinedAt: now,
          },
          {
            id: `${viewerId}_team_membership`,
            tenantId,
            teamId,
            userId: viewerId,
            status: "active",
            role: "viewer",
            joinedAt: now,
          },
        ]);

        await transaction.insert(authSessions).values([
          {
            id: `${checkId}_manager_session`,
            userId: managerId,
            sessionReferenceHash: hashAuthSessionReference(managerReference),
            status: "active",
            issuedAt: now,
            expiresAt: future,
          },
          {
            id: `${checkId}_reviewer_session`,
            userId: reviewerId,
            sessionReferenceHash: hashAuthSessionReference(reviewerReference),
            status: "active",
            issuedAt: now,
            expiresAt: future,
          },
          {
            id: `${checkId}_viewer_session`,
            userId: viewerId,
            sessionReferenceHash: hashAuthSessionReference(viewerReference),
            status: "active",
            issuedAt: now,
            expiresAt: future,
          },
        ]);

        const authRepository = createAuthSessionRepository(
          transaction as unknown as AuthSessionRepositoryDatabase,
        );
        const racketRepository = createRacketProductRepository(
          transaction as unknown as RacketProductRepositoryDatabase,
        );
        const url = scopedProductsUrl(tenantId, teamId);

        const missingCookieList = await handleRacketProductsListRoute(
          null,
          null,
          new Request(url),
        );
        expectNoStore("missing-cookie list", missingCookieList);
        const missingCookieListBody = await readJson(missingCookieList);
        if (
          missingCookieList.status !== 401 ||
          missingCookieListBody.ok !== false ||
          missingCookieListBody.code !== "UNAUTHENTICATED"
        ) {
          throw new Error("Missing-cookie list was not denied safely");
        }

        const missingScopeList = await handleRacketProductsListRoute(
          authRepository,
          racketRepository,
          requestWithCookie(
            "https://operation.local/api/rackets/products",
            managerReference,
          ),
        );
        expectNoStore("missing-scope list", missingScopeList);
        const missingScopeListBody = await readJson(missingScopeList);
        if (
          missingScopeList.status !== 400 ||
          missingScopeListBody.code !== "AUTH_SCOPE_REQUIRED"
        ) {
          throw new Error("Missing-scope list was not explicit");
        }

        const csrfBlockedCreate = await handleRacketProductsCreateRoute(
          null,
          null,
          createRequest({
            url,
            sessionReference: managerReference,
            csrf: false,
          }),
        );
        expectNoStore("csrf-blocked create", csrfBlockedCreate);
        const csrfBlockedCreateBody = await readJson(csrfBlockedCreate);
        if (
          csrfBlockedCreate.status !== 403 ||
          csrfBlockedCreateBody.code !== "CSRF_HEADER_REQUIRED"
        ) {
          throw new Error("Create without CSRF header was not blocked safely");
        }

        const createdResponse = await handleRacketProductsCreateRoute(
          authRepository,
          racketRepository,
          createRequest({
            url,
            sessionReference: managerReference,
            csrf: true,
            body: {
              ...productInput("Astrox 100 ZZ", ["AX100ZZ"]),
              tenantId: "client_supplied_tenant",
              teamId: "client_supplied_team",
              actorId: "client_supplied_actor",
            },
          }),
        );
        expectNoStore("authorized create", createdResponse);
        const createdBody = await readJson(createdResponse);
        if (
          createdResponse.status !== 201 ||
          createdBody.ok !== true ||
          (createdBody.product as JsonObject | undefined)?.model !==
            "Astrox 100 ZZ"
        ) {
          throw new Error("Authorized create did not return product view");
        }
        expectNoSensitive("authorized create", createdBody);
        const createdProduct = createdBody.product as JsonObject;
        const createdProductId = String(createdProduct.id);

        const sourceUrl = scopedApiUrl(
          `/api/rackets/products/${createdProductId}/sources`,
          tenantId,
          teamId,
        );
        const submitUrl = scopedApiUrl(
          `/api/rackets/products/${createdProductId}/submit`,
          tenantId,
          teamId,
        );
        const publishUrl = scopedApiUrl(
          `/api/rackets/products/${createdProductId}/publish`,
          tenantId,
          teamId,
        );
        const reviewDecisionUrl = scopedApiUrl(
          "/api/rackets/review-decisions",
          tenantId,
          teamId,
        );
        const reviewQueueUrl = scopedApiUrl(
          "/api/rackets/review-queue?limit=20",
          tenantId,
          teamId,
        );

        const sourceCsrfBlocked = await handleRacketProductSourceCreateRoute(
          null,
          null,
          mutationRequest({
            url: sourceUrl,
            sessionReference: managerReference,
            csrf: false,
            body: sourceInput(createdProductId),
          }),
          { productId: createdProductId },
        );
        expectNoStore("source csrf-blocked", sourceCsrfBlocked);
        const sourceCsrfBlockedBody = await readJson(sourceCsrfBlocked);
        if (
          sourceCsrfBlocked.status !== 403 ||
          sourceCsrfBlockedBody.code !== "CSRF_HEADER_REQUIRED"
        ) {
          throw new Error("Source route did not block missing CSRF");
        }

        const sourceResponse = await handleRacketProductSourceCreateRoute(
          authRepository,
          racketRepository,
          mutationRequest({
            url: sourceUrl,
            sessionReference: managerReference,
            csrf: true,
            body: {
              ...sourceInput("client_supplied_product"),
              tenantId: "client_supplied_tenant",
            },
          }),
          { productId: createdProductId },
        );
        expectNoStore("source create", sourceResponse);
        const sourceBody = await readJson(sourceResponse);
        const source = sourceBody.source as JsonObject | undefined;
        if (
          sourceResponse.status !== 201 ||
          sourceBody.ok !== true ||
          source?.productId !== createdProductId ||
          source?.reviewState !== "pending"
        ) {
          throw new Error("Authorized source route did not return source view");
        }

        const queueResponse = await handleRacketReviewQueueRoute(
          authRepository,
          racketRepository,
          requestWithCookie(reviewQueueUrl, managerReference),
        );
        expectNoStore("review queue", queueResponse);
        const queueBody = await readJson(queueResponse);
        const queueItems = queueBody.items as JsonObject[] | undefined;
        if (
          queueResponse.status !== 200 ||
          queueBody.ok !== true ||
          !Array.isArray(queueItems) ||
          !queueItems.some(
            (item) =>
              ((item.product as JsonObject | undefined)?.id as string | undefined) ===
                createdProductId &&
              ((item.sourceSummary as JsonObject | undefined)?.pending as number | undefined) ===
                1,
          )
        ) {
          throw new Error("Review queue did not return source summary");
        }

        const submittedResponse = await handleRacketProductSubmitRoute(
          authRepository,
          racketRepository,
          mutationRequest({
            url: submitUrl,
            sessionReference: managerReference,
            csrf: true,
            body: { productId: "client_supplied_product" },
          }),
          { productId: createdProductId },
        );
        expectNoStore("submit product", submittedResponse);
        const submittedBody = await readJson(submittedResponse);
        if (
          submittedResponse.status !== 200 ||
          submittedBody.ok !== true ||
          (submittedBody.product as JsonObject | undefined)?.status !== "reviewing"
        ) {
          throw new Error("Submit route did not move product to reviewing");
        }

        const viewerDecisionResponse = await handleRacketReviewDecisionRoute(
          authRepository,
          racketRepository,
          mutationRequest({
            url: reviewDecisionUrl,
            sessionReference: viewerReference,
            csrf: true,
            body: {
              productId: createdProductId,
              targetType: "source",
              targetId: source.id,
              decision: "approve",
              reason: "Viewer cannot approve",
            },
          }),
        );
        expectNoStore("viewer review decision", viewerDecisionResponse);
        const viewerDecisionBody = await readJson(viewerDecisionResponse);
        if (
          viewerDecisionResponse.status !== 403 ||
          viewerDecisionBody.code !== "FORBIDDEN_PERMISSION"
        ) {
          throw new Error("Viewer review decision was not denied");
        }

        const approvedSourceResponse = await handleRacketReviewDecisionRoute(
          authRepository,
          racketRepository,
          mutationRequest({
            url: reviewDecisionUrl,
            sessionReference: reviewerReference,
            csrf: true,
            body: {
              productId: createdProductId,
              targetType: "source",
              targetId: source.id,
              decision: "approve",
              reason: "Official source matches product specs",
            },
          }),
        );
        expectNoStore("source approval", approvedSourceResponse);
        const approvedSourceBody = await readJson(approvedSourceResponse);
        if (
          approvedSourceResponse.status !== 200 ||
          approvedSourceBody.ok !== true ||
          approvedSourceBody.targetType !== "source" ||
          (approvedSourceBody.source as JsonObject | undefined)?.reviewState !==
            "approved"
        ) {
          throw new Error("Source approval route did not return approved source");
        }

        const approvedProductResponse = await handleRacketReviewDecisionRoute(
          authRepository,
          racketRepository,
          mutationRequest({
            url: reviewDecisionUrl,
            sessionReference: reviewerReference,
            csrf: true,
            body: {
              productId: createdProductId,
              targetType: "product",
              targetId: createdProductId,
              decision: "approve",
              reason: "Approved source is attached",
            },
          }),
        );
        expectNoStore("product approval", approvedProductResponse);
        const approvedProductBody = await readJson(approvedProductResponse);
        if (
          approvedProductResponse.status !== 200 ||
          approvedProductBody.ok !== true ||
          approvedProductBody.targetType !== "product" ||
          (approvedProductBody.product as JsonObject | undefined)?.status !== "approved"
        ) {
          throw new Error("Product approval route did not return approved product");
        }

        const publishResponse = await handleRacketProductPublishRoute(
          authRepository,
          racketRepository,
          mutationRequest({
            url: publishUrl,
            sessionReference: reviewerReference,
            csrf: true,
            body: { changeReason: "Ready for downstream workflows" },
          }),
          { productId: createdProductId },
        );
        expectNoStore("publish product", publishResponse);
        const publishBody = await readJson(publishResponse);
        const publishedProduct = publishBody.product as JsonObject | undefined;
        if (
          publishResponse.status !== 200 ||
          publishBody.ok !== true ||
          publishedProduct?.status !== "published" ||
          !Array.isArray(publishedProduct.sourceIds) ||
          publishedProduct.sourceIds.length !== 1
        ) {
          throw new Error("Publish route did not return published product");
        }
        expectNoSensitive("publish product", publishBody);

        const listResponse = await handleRacketProductsListRoute(
          authRepository,
          racketRepository,
          requestWithCookie(url, managerReference),
        );
        expectNoStore("authorized list", listResponse);
        const listBody = await readJson(listResponse);
        const products = listBody.products as JsonObject[] | undefined;
        if (
          listResponse.status !== 200 ||
          listBody.ok !== true ||
          !Array.isArray(products) ||
          products.length !== 1 ||
          products[0]?.model !== "Astrox 100 ZZ"
        ) {
          throw new Error("Authorized list did not return scoped product");
        }

        const duplicateResponse = await handleRacketProductsCreateRoute(
          authRepository,
          racketRepository,
          createRequest({
            url,
            sessionReference: managerReference,
            csrf: true,
            body: productInput(" ASTROX100zz "),
          }),
        );
        expectNoStore("duplicate create", duplicateResponse);
        const duplicateBody = await readJson(duplicateResponse);
        if (
          duplicateResponse.status !== 409 ||
          duplicateBody.code !== "DUPLICATE_MODEL"
        ) {
          throw new Error("Duplicate model was not reported as conflict");
        }

        const invalidResponse = await handleRacketProductsCreateRoute(
          authRepository,
          racketRepository,
          createRequest({
            url,
            sessionReference: managerReference,
            csrf: true,
            body: { brand: "", model: "" },
          }),
        );
        expectNoStore("invalid create", invalidResponse);
        const invalidBody = await readJson(invalidResponse);
        if (
          invalidResponse.status !== 400 ||
          invalidBody.code !== "VALIDATION_ERROR"
        ) {
          throw new Error("Invalid create did not return validation error");
        }

        const viewerCreateResponse = await handleRacketProductsCreateRoute(
          authRepository,
          racketRepository,
          createRequest({
            url,
            sessionReference: viewerReference,
            csrf: true,
            body: productInput("Nanoflare 1000 Z"),
          }),
        );
        expectNoStore("viewer create", viewerCreateResponse);
        const viewerCreateBody = await readJson(viewerCreateResponse);
        if (
          viewerCreateResponse.status !== 403 ||
          viewerCreateBody.code !== "FORBIDDEN_PERMISSION"
        ) {
          throw new Error("Viewer create was not denied by permission");
        }

        const otherTeamCreateResponse = await handleRacketProductsCreateRoute(
          authRepository,
          racketRepository,
          createRequest({
            url: scopedProductsUrl(tenantId, otherTeamId),
            sessionReference: managerReference,
            csrf: true,
            body: productInput("other_team_hidden_product"),
          }),
        );
        if (otherTeamCreateResponse.status !== 201) {
          throw new Error("Other-team setup product was not created");
        }

        const afterOtherTeamList = await handleRacketProductsListRoute(
          authRepository,
          racketRepository,
          requestWithCookie(url, managerReference),
        );
        const afterOtherTeamListBody = await readJson(afterOtherTeamList);
        expectNoSensitive("cross-team list", afterOtherTeamListBody);
        const afterOtherTeamProducts = afterOtherTeamListBody.products as
          | JsonObject[]
          | undefined;
        if (
          !Array.isArray(afterOtherTeamProducts) ||
          afterOtherTeamProducts.length !== 1
        ) {
          throw new Error("List leaked or lost scoped product records");
        }

        const redactedResponse = await handleRacketProductsListRoute(
          authRepository,
          racketRepository,
          new Request(url, {
            headers: {
              cookie: `${authSessionCookieName}=raw_cookie_value`,
              authorization: "Bearer raw_session_secret",
              "x-provider-session-id": "provider_session_raw",
            },
          }),
        );
        const redactedBody = await readJson(redactedResponse);
        expectNoSensitive("redacted route error", redactedBody);

        throw new ExpectedRollback();
      });
    } catch (error) {
      if (!(error instanceof ExpectedRollback)) {
        throw error;
      }
    }

    console.log("Racket product route check passed; transaction rolled back.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown rackets:route-check failure",
  );
  process.exitCode = 1;
});
