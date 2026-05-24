import {
  authSessionCookieName,
  createAuthSessionRepository,
  type AuthSessionRepositoryDatabase,
} from "../auth";
import {
  handleOperatorV0SessionRoute,
  OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_NAME,
  OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_VALUE,
  operatorV0TeamId,
  operatorV0TenantId,
  type OperatorV0BootstrapDatabase,
} from "../auth/operator-v0";
import { createDatabaseConnection } from "../db/client";
import {
  createKnowledgeLifecycleRepository,
  type KnowledgeLifecycleRepositoryDatabase,
} from "../knowledge/repository";
import {
  handleKnowledgeSourcesCreateRoute,
  handleKnowledgeSourcesListRoute,
  KNOWLEDGE_LIFECYCLE_MUTATION_CSRF_HEADER_NAME,
  KNOWLEDGE_LIFECYCLE_MUTATION_CSRF_HEADER_VALUE,
} from "../knowledge/route";
import {
  createRacketProductRepository,
  type RacketProductRepositoryDatabase,
} from "../rackets/repository";
import {
  handleRacketProductsCreateRoute,
  handleRacketProductsListRoute,
  RACKET_PRODUCT_MUTATION_CSRF_HEADER_NAME,
  RACKET_PRODUCT_MUTATION_CSRF_HEADER_VALUE,
} from "../rackets/route";
import {
  createDefaultKnowledgeSourceDraft,
  createDefaultRacketProductDraft,
  createKnowledgeSourcePayload,
  createRacketProductPayload,
} from "../../lib/reference-data-v0-workflow";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local operator V0 reference-data workflow check");
  }
}

type JsonObject = Record<string, unknown>;

function bootstrapRequest(): Request {
  return new Request("https://operation.local/api/auth/operator-v0-session", {
    method: "POST",
    headers: {
      [OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_NAME]:
        OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_VALUE,
    },
  });
}

function scopedUrl(path: string): string {
  return `https://operation.local${path}?tenantId=${operatorV0TenantId}&teamId=${operatorV0TeamId}`;
}

function readRequest(setCookie: string | null, url: string): Request {
  const cookieValue = setCookie?.split(";")[0] ?? "";

  return new Request(url, {
    headers: cookieValue ? { cookie: cookieValue } : undefined,
  });
}

function jsonRequest(input: {
  url: string;
  setCookie?: string | null;
  csrf?: {
    name: string;
    value: string;
  };
  body?: unknown;
}): Request {
  const headers = new Headers({
    "content-type": "application/json",
  });
  const cookieValue = input.setCookie?.split(";")[0] ?? "";

  if (cookieValue) {
    headers.set("cookie", cookieValue);
  }

  if (input.csrf) {
    headers.set(input.csrf.name, input.csrf.value);
  }

  return new Request(input.url, {
    method: "POST",
    headers,
    body: JSON.stringify(input.body ?? {}),
  });
}

async function readJson(response: Response): Promise<JsonObject> {
  const body = await response.json();

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Operator V0 reference-data response was not a JSON object");
  }

  return body as JsonObject;
}

function expectStatus(label: string, response: Response, status: number) {
  if (response.status !== status) {
    throw new Error(`${label} returned ${response.status}, expected ${status}`);
  }
}

function expectNoStore(label: string, response: Response) {
  if (response.headers.get("cache-control") !== "no-store") {
    throw new Error(`${label} did not return Cache-Control: no-store`);
  }
}

function expectNoSensitive(label: string, value: unknown) {
  const serialized = JSON.stringify(value);

  for (const leaked of [
    authSessionCookieName,
    "raw_cookie_value",
    "raw_session_secret",
    "provider_session_raw",
    "postgres://",
    "客户手机号",
    "完整未脱敏转录",
    "unpublished_source_text",
    "provider payload",
    "Authorization",
    "Bearer",
    "sk-",
  ]) {
    if (serialized.includes(leaked)) {
      throw new Error(`${label} leaked sensitive metadata`);
    }
  }
}

function getObject(source: JsonObject, key: string, label: string): JsonObject {
  const value = source[key];

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} did not include ${key}`);
  }

  return value as JsonObject;
}

function getArray(source: JsonObject, key: string, label: string): JsonObject[] {
  const value = source[key];

  if (!Array.isArray(value)) {
    throw new Error(`${label} did not include ${key}`);
  }

  return value as JsonObject[];
}

function getString(source: JsonObject, key: string, label: string): string {
  const value = source[key];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} did not include ${key}`);
  }

  return value;
}

async function main() {
  const { client, db } = createDatabaseConnection();
  const checkId = `reference_data_v0_${Date.now().toString(36)}`;

  try {
    try {
      await db.transaction(async (transaction) => {
        const bootstrapResponse = await handleOperatorV0SessionRoute(
          transaction as unknown as OperatorV0BootstrapDatabase,
          bootstrapRequest(),
          { enabled: true },
        );
        expectStatus("bootstrap", bootstrapResponse, 200);
        expectNoStore("bootstrap", bootstrapResponse);

        const setCookie = bootstrapResponse.headers.get("set-cookie");
        const bootstrapBody = await readJson(bootstrapResponse);
        const permissions = getObject(
          bootstrapBody,
          "membership",
          "bootstrap",
        ).permissions;

        if (
          !Array.isArray(permissions) ||
          !permissions.includes("manage_products") ||
          !permissions.includes("review_knowledge")
        ) {
          throw new Error("V0 bootstrap did not grant reference-data permissions");
        }
        expectNoSensitive("bootstrap", bootstrapBody);

        const authRepository = createAuthSessionRepository(
          transaction as unknown as AuthSessionRepositoryDatabase,
        );
        const racketRepository = createRacketProductRepository(
          transaction as unknown as RacketProductRepositoryDatabase,
        );
        const knowledgeRepository = createKnowledgeLifecycleRepository(
          transaction as unknown as KnowledgeLifecycleRepositoryDatabase,
        );

        const productUrl = scopedUrl("/api/rackets/products");
        const sourceUrl = scopedUrl("/api/knowledge/sources");

        const productMissingAuth = await handleRacketProductsListRoute(
          authRepository,
          racketRepository,
          new Request(productUrl),
        );
        expectStatus("product missing auth", productMissingAuth, 401);
        expectNoStore("product missing auth", productMissingAuth);
        expectNoSensitive("product missing auth", await readJson(productMissingAuth));

        const productMissingScope = await handleRacketProductsListRoute(
          authRepository,
          racketRepository,
          readRequest(setCookie, "https://operation.local/api/rackets/products"),
        );
        expectStatus("product missing scope", productMissingScope, 400);
        expectNoStore("product missing scope", productMissingScope);

        const productMissingCsrf = await handleRacketProductsCreateRoute(
          authRepository,
          racketRepository,
          jsonRequest({
            url: productUrl,
            setCookie,
            body: createRacketProductPayload({
              ...createDefaultRacketProductDraft(),
              model: `${checkId} missing csrf`,
            }),
          }),
        );
        expectStatus("product missing csrf", productMissingCsrf, 403);
        expectNoStore("product missing csrf", productMissingCsrf);

        const knowledgeMissingAuth = await handleKnowledgeSourcesListRoute(
          authRepository,
          knowledgeRepository,
          new Request(sourceUrl),
        );
        expectStatus("knowledge missing auth", knowledgeMissingAuth, 401);
        expectNoStore("knowledge missing auth", knowledgeMissingAuth);
        expectNoSensitive(
          "knowledge missing auth",
          await readJson(knowledgeMissingAuth),
        );

        const knowledgeMissingScope = await handleKnowledgeSourcesListRoute(
          authRepository,
          knowledgeRepository,
          readRequest(setCookie, "https://operation.local/api/knowledge/sources"),
        );
        expectStatus("knowledge missing scope", knowledgeMissingScope, 400);
        expectNoStore("knowledge missing scope", knowledgeMissingScope);

        const knowledgeMissingCsrf = await handleKnowledgeSourcesCreateRoute(
          authRepository,
          knowledgeRepository,
          jsonRequest({
            url: sourceUrl,
            setCookie,
            body: createKnowledgeSourcePayload({
              ...createDefaultKnowledgeSourceDraft(),
              title: `${checkId} missing csrf`,
              url: "https://example.invalid/missing-csrf",
            }),
          }),
        );
        expectStatus("knowledge missing csrf", knowledgeMissingCsrf, 403);
        expectNoStore("knowledge missing csrf", knowledgeMissingCsrf);

        const productModel = `V0 Reference ${checkId}`;
        const createProductResponse = await handleRacketProductsCreateRoute(
          authRepository,
          racketRepository,
          jsonRequest({
            url: productUrl,
            setCookie,
            csrf: {
              name: RACKET_PRODUCT_MUTATION_CSRF_HEADER_NAME,
              value: RACKET_PRODUCT_MUTATION_CSRF_HEADER_VALUE,
            },
            body: {
              ...createRacketProductPayload({
                ...createDefaultRacketProductDraft(),
                model: productModel,
                aliases: `${productModel.replace(/\s+/g, "")}-V0`,
              }),
              tenantId: "client_supplied_tenant",
              teamId: "client_supplied_team",
              actorId: "client_supplied_actor",
            },
          }),
        );
        expectStatus("product create", createProductResponse, 201);
        expectNoStore("product create", createProductResponse);
        const createProductBody = await readJson(createProductResponse);
        const product = getObject(createProductBody, "product", "product create");
        const productId = getString(product, "id", "product create");

        if (product.model !== productModel) {
          throw new Error("Product create did not return the created model");
        }
        expectNoSensitive("product create", createProductBody);

        const listProductsResponse = await handleRacketProductsListRoute(
          authRepository,
          racketRepository,
          readRequest(setCookie, productUrl),
        );
        expectStatus("product list", listProductsResponse, 200);
        expectNoStore("product list", listProductsResponse);
        const products = getArray(
          await readJson(listProductsResponse),
          "products",
          "product list",
        );

        if (!products.some((item) => item.id === productId)) {
          throw new Error("Product list did not include the scoped V0 product");
        }

        const sourceTitle = `V0 Reference Source ${checkId}`;
        const createSourceResponse = await handleKnowledgeSourcesCreateRoute(
          authRepository,
          knowledgeRepository,
          jsonRequest({
            url: sourceUrl,
            setCookie,
            csrf: {
              name: KNOWLEDGE_LIFECYCLE_MUTATION_CSRF_HEADER_NAME,
              value: KNOWLEDGE_LIFECYCLE_MUTATION_CSRF_HEADER_VALUE,
            },
            body: {
              ...createKnowledgeSourcePayload({
                ...createDefaultKnowledgeSourceDraft(),
                title: sourceTitle,
                url: `https://example.invalid/${checkId}/source`,
              }),
              tenantId: "client_supplied_tenant",
              teamId: "client_supplied_team",
              actorId: "client_supplied_actor",
            },
          }),
        );
        expectStatus("knowledge source create", createSourceResponse, 201);
        expectNoStore("knowledge source create", createSourceResponse);
        const createSourceBody = await readJson(createSourceResponse);
        const source = getObject(
          createSourceBody,
          "source",
          "knowledge source create",
        );
        const sourceId = getString(source, "id", "knowledge source create");

        if (source.title !== sourceTitle) {
          throw new Error("Knowledge source create did not return the source");
        }
        expectNoSensitive("knowledge source create", createSourceBody);

        const listSourcesResponse = await handleKnowledgeSourcesListRoute(
          authRepository,
          knowledgeRepository,
          readRequest(setCookie, sourceUrl),
        );
        expectStatus("knowledge source list", listSourcesResponse, 200);
        expectNoStore("knowledge source list", listSourcesResponse);
        const sources = getArray(
          await readJson(listSourcesResponse),
          "sources",
          "knowledge source list",
        );

        if (!sources.some((item) => item.id === sourceId)) {
          throw new Error(
            "Knowledge source list did not include the scoped V0 source",
          );
        }

        const redactedProductError = await handleRacketProductsListRoute(
          authRepository,
          racketRepository,
          new Request(productUrl, {
            headers: {
              cookie: `${authSessionCookieName}=raw_cookie_value`,
              authorization: "Bearer raw_session_secret",
              "x-provider-session-id": "provider_session_raw",
            },
          }),
        );
        expectNoSensitive(
          "redacted product route error",
          await readJson(redactedProductError),
        );

        const redactedKnowledgeError = await handleKnowledgeSourcesListRoute(
          authRepository,
          knowledgeRepository,
          new Request(sourceUrl, {
            headers: {
              cookie: `${authSessionCookieName}=raw_cookie_value`,
              authorization: "Bearer raw_session_secret",
              "x-provider-session-id": "provider_session_raw",
            },
          }),
        );
        expectNoSensitive(
          "redacted knowledge route error",
          await readJson(redactedKnowledgeError),
        );

        throw new ExpectedRollback();
      });
    } catch (error) {
      if (error instanceof ExpectedRollback) {
        return;
      }

      throw error;
    }

    console.log(
      "Operator V0 reference-data workflow check passed; transaction rolled back.",
    );
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown reference-data:v0-check failure",
  );
  process.exitCode = 1;
});
