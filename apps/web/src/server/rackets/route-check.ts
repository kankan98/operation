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
  handleRacketProductsListRoute,
  handleRacketProductsCreateRoute,
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

function scopedUrl(tenantId: string, teamId: string): string {
  return `https://operation.local/api/rackets/products?tenantId=${tenantId}&teamId=${teamId}`;
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
        const viewerId = `${checkId}_viewer`;
        const managerReference = createAuthSessionReference();
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
        const url = scopedUrl(tenantId, teamId);

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
            url: scopedUrl(tenantId, otherTeamId),
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
