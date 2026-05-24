import "server-only";

import { createHash } from "node:crypto";

import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import type { DatabaseClient } from "../db/client";
import type { DataAccessContext } from "../db/context";
import { createRecordId } from "../db/repository";
import {
  racketProductAliases,
  racketProductSources,
  racketProducts,
  racketReviewDecisions,
  type RacketProductAliasRecord,
  type RacketProductRecord,
  type RacketProductSourceRecord,
} from "../db/schema";

export type RacketProductRepositoryDatabase = Pick<
  DatabaseClient,
  "insert" | "select" | "update"
>;

export type RacketProductErrorCode =
  | "VALIDATION_ERROR"
  | "FORBIDDEN_PERMISSION"
  | "DUPLICATE_MODEL"
  | "ALIAS_CONFLICT"
  | "SOURCE_CONFLICT"
  | "MISSING_SOURCE"
  | "NOT_FOUND"
  | "STATE_TRANSITION_INVALID"
  | "DATABASE_OPERATION_FAILED";

export class RacketProductError extends Error {
  readonly code: RacketProductErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(
    code: RacketProductErrorCode,
    message: string,
    options?: {
      cause?: unknown;
      details?: Record<string, unknown>;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = "RacketProductError";
    this.code = code;
    this.details = options?.details;
  }
}

const productStatusSchema = z.enum([
  "draft",
  "needs_source",
  "reviewing",
  "approved",
  "published",
  "stale",
  "conflict",
  "archived",
  "rejected",
]);

const balanceTypeSchema = z.enum([
  "head_light",
  "even",
  "head_heavy",
  "unknown",
]);

const aliasTypeSchema = z.enum([
  "official_en",
  "official_cn",
  "series_short",
  "live_spoken",
  "common_typo",
  "team_note",
]);

const aliasConfidenceSchema = z.enum(["high", "medium", "low"]);
const sourceTypeSchema = z.enum([
  "official_site",
  "brand_catalog",
  "commerce_page",
  "team_note",
  "manual_review",
]);
const sourceTrustLevelSchema = z.enum([
  "official",
  "commerce",
  "team",
  "unknown",
]);
const sourceRefreshPolicySchema = z.enum([
  "manual",
  "monthly",
  "quarterly",
  "on_demand",
]);
const reviewTargetTypeSchema = z.enum(["product", "source"]);
const reviewDecisionSchema = z.enum([
  "approve",
  "reject",
  "request_source",
  "mark_conflict",
  "archive",
]);

const stringField = (max: number) => z.string().trim().min(1).max(max);
const optionalStringField = (max: number) =>
  z.string().trim().max(max).optional().default("");
const boundedStringList = z
  .array(z.string().trim().min(1).max(120))
  .max(16)
  .default([]);

const aliasInputSchema = z.object({
  alias: stringField(180),
  aliasType: aliasTypeSchema,
  confidence: aliasConfidenceSchema.default("medium"),
});

const createProductInputSchema = z.object({
  brand: stringField(120),
  series: optionalStringField(120),
  model: stringField(180),
  status: productStatusSchema.optional(),
  aliases: z.array(aliasInputSchema).max(24).default([]),
  specs: z.object({
    weightClasses: boundedStringList,
    balancePoint: optionalStringField(120),
    balanceType: balanceTypeSchema.default("unknown"),
    shaftStiffness: optionalStringField(120),
    recommendedTension: optionalStringField(120),
  }),
  positioning: z.object({
    playerLevels: boundedStringList,
    playStyles: boundedStringList,
    priceBand: optionalStringField(120),
    sellingFocus: boundedStringList,
    limitations: boundedStringList,
  }),
  sourceIds: z.array(z.string().trim().min(1).max(160)).max(24).default([]),
});

const listProductInputSchema = z
  .object({
    status: z.array(productStatusSchema).max(12).optional(),
    search: z.string().trim().min(1).max(180).optional(),
    limit: z.number().int().min(1).max(100).default(20),
  });

const productIdInputSchema = z.object({
  productId: stringField(160),
});

const registerSourceInputSchema = productIdInputSchema.extend({
  sourceType: sourceTypeSchema,
  title: stringField(240),
  url: optionalStringField(2048),
  retrievedAt: z.coerce.date(),
  trustLevel: sourceTrustLevelSchema.default("unknown"),
  refreshPolicy: sourceRefreshPolicySchema.default("manual"),
});

const reviewDecisionInputSchema = productIdInputSchema.extend({
  targetType: reviewTargetTypeSchema,
  targetId: stringField(160),
  decision: reviewDecisionSchema,
  reason: stringField(500),
});

const publishProductInputSchema = productIdInputSchema.extend({
  changeReason: stringField(500),
});

const reviewQueueInputSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
});

export type CreateRacketProductInput = z.input<typeof createProductInputSchema>;
export type ListRacketProductsInput = z.input<typeof listProductInputSchema>;
export type RegisterRacketSourceInput = z.input<
  typeof registerSourceInputSchema
>;
export type RacketReviewDecisionInput = z.input<
  typeof reviewDecisionInputSchema
>;
export type PublishRacketProductInput = z.input<
  typeof publishProductInputSchema
>;
export type ListRacketReviewQueueInput = z.input<
  typeof reviewQueueInputSchema
>;

export type RacketProductWorkflow =
  | "session_capture"
  | "ai_review"
  | "talk_tracks"
  | "qa_agent";

export type RacketDownstreamReadiness = {
  workflow: RacketProductWorkflow;
  ready: boolean;
  blockedBy: string[];
};

export type RacketProductView = {
  id: string;
  brand: string;
  series: string;
  model: string;
  normalizedModel: string;
  status: z.infer<typeof productStatusSchema>;
  aliases: string[];
  specs: {
    weightClasses: string[];
    balancePoint: string | null;
    balanceType: z.infer<typeof balanceTypeSchema>;
    shaftStiffness: string | null;
    recommendedTension: string | null;
  };
  positioning: {
    playerLevels: string[];
    playStyles: string[];
    priceBand: string | null;
    sellingFocus: string[];
    limitations: string[];
  };
  sourceIds: string[];
  downstreamReadiness: RacketDownstreamReadiness[];
  createdAt: Date;
  updatedAt: Date;
};

export type RacketProductListResult = {
  items: RacketProductView[];
};

export type RacketProductSourceView = {
  id: string;
  productId: string;
  sourceType: z.infer<typeof sourceTypeSchema>;
  title: string;
  url: string | null;
  normalizedSourceKey: string;
  retrievedAt: Date;
  trustLevel: z.infer<typeof sourceTrustLevelSchema>;
  refreshPolicy: z.infer<typeof sourceRefreshPolicySchema>;
  reviewState: RacketProductSourceRecord["reviewState"];
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RacketSourceSummary = {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  stale: number;
};

export type RacketReviewQueueItem = {
  product: RacketProductView;
  sourceSummary: RacketSourceSummary;
};

export type RacketReviewQueueResult = {
  items: RacketReviewQueueItem[];
};

function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);

  if (parsed.success) {
    return parsed.data;
  }

  throw new RacketProductError("VALIDATION_ERROR", "Racket product input is invalid", {
    details: {
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    },
  });
}

function assertPermission(
  context: DataAccessContext,
  allowedPermissions: string[],
) {
  if (
    !allowedPermissions.some((permission) =>
      context.permissions.includes(permission),
    )
  ) {
    throw new RacketProductError(
      "FORBIDDEN_PERMISSION",
      "Actor is missing required product permission",
      {
        details: {
          requestId: context.requestId,
        },
      },
    );
  }
}

function normalizeLookupValue(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/[\s_-]+/g, "");
}

function normalizeSourceKey(input: {
  sourceType: z.infer<typeof sourceTypeSchema>;
  url: string;
  title: string;
}): string {
  const sourceIdentity = input.url.length > 0 ? input.url : input.title;
  const normalizedIdentity = sourceIdentity
    .trim()
    .toLocaleLowerCase()
    .replace(/\/+$/g, "");
  const digest = createHash("sha256")
    .update(`${input.sourceType}:${normalizedIdentity}`)
    .digest("hex");

  return `${input.sourceType}:${digest}`;
}

function defaultProductStatus(input: {
  status?: z.infer<typeof productStatusSchema>;
  sourceIds: string[];
}): z.infer<typeof productStatusSchema> {
  if (input.status) {
    return input.status;
  }

  return input.sourceIds.length > 0 ? "reviewing" : "needs_source";
}

function readinessForStatus(
  status: z.infer<typeof productStatusSchema>,
): RacketDownstreamReadiness[] {
  const workflows: RacketProductWorkflow[] = [
    "session_capture",
    "ai_review",
    "talk_tracks",
    "qa_agent",
  ];

  if (status === "published") {
    return workflows.map((workflow) => ({
      workflow,
      ready: true,
      blockedBy: [],
    }));
  }

  if (status === "approved") {
    return workflows.map((workflow) => ({
      workflow,
      ready: workflow !== "qa_agent",
      blockedBy: workflow === "qa_agent" ? ["not_published"] : [],
    }));
  }

  const statusBlockers: Record<z.infer<typeof productStatusSchema>, string[]> = {
    draft: ["draft"],
    needs_source: ["missing_source", "not_published"],
    reviewing: ["reviewing", "not_published"],
    approved: ["not_published"],
    published: [],
    stale: ["stale"],
    conflict: ["conflict"],
    archived: ["archived"],
    rejected: ["rejected"],
  };

  return workflows.map((workflow) => ({
    workflow,
    ready: false,
    blockedBy: statusBlockers[status],
  }));
}

function toNullable(value: string): string | null {
  return value.length > 0 ? value : null;
}

function toSourceView(source: RacketProductSourceRecord): RacketProductSourceView {
  return {
    id: source.id,
    productId: source.productId,
    sourceType: source.sourceType,
    title: source.title,
    url: toNullable(source.url),
    normalizedSourceKey: source.normalizedSourceKey,
    retrievedAt: source.retrievedAt,
    trustLevel: source.trustLevel,
    refreshPolicy: source.refreshPolicy,
    reviewState: source.reviewState,
    reviewedAt: source.reviewedAt,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}

function summarizeSources(
  sources: RacketProductSourceRecord[],
): RacketSourceSummary {
  return {
    total: sources.length,
    approved: sources.filter((source) => source.reviewState === "approved")
      .length,
    pending: sources.filter((source) => source.reviewState === "pending")
      .length,
    rejected: sources.filter((source) => source.reviewState === "rejected")
      .length,
    stale: sources.filter((source) => source.reviewState === "stale").length,
  };
}

function toProductView(
  product: RacketProductRecord,
  aliases: RacketProductAliasRecord[],
): RacketProductView {
  return {
    id: product.id,
    brand: product.brand,
    series: product.series,
    model: product.model,
    normalizedModel: product.normalizedModel,
    status: product.status,
    aliases: aliases.map((alias) => alias.alias),
    specs: {
      weightClasses: product.weightClasses,
      balancePoint: toNullable(product.balancePoint),
      balanceType: product.balanceType,
      shaftStiffness: toNullable(product.shaftStiffness),
      recommendedTension: toNullable(product.recommendedTension),
    },
    positioning: {
      playerLevels: product.playerLevels,
      playStyles: product.playStyles,
      priceBand: toNullable(product.priceBand),
      sellingFocus: product.sellingFocus,
      limitations: product.limitations,
    },
    sourceIds: product.sourceIds,
    downstreamReadiness: readinessForStatus(product.status),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function getDatabaseConstraintName(error: unknown): string {
  let current: unknown = error;

  while (current && typeof current === "object") {
    const record = current as Record<string, unknown>;
    const constraint =
      record.constraint_name ?? record.constraint ?? record.constraintName;

    if (typeof constraint === "string") {
      return constraint;
    }

    current = record.cause;
  }

  return "";
}

function sanitizeDatabaseMessage(message: string): string {
  return message.replace(/postgres(?:ql)?:\/\/[^@\s]+@/gi, "postgres://[redacted]@");
}

function getDatabaseErrorMessage(error: Error): string {
  const cause =
    error.cause instanceof Error ? `: ${error.cause.message}` : "";

  return sanitizeDatabaseMessage(`${error.message}${cause}`);
}

function mapDatabaseError(error: unknown): RacketProductError {
  if (error instanceof RacketProductError) {
    return error;
  }

  if (error instanceof Error) {
    const constraintName = getDatabaseConstraintName(error);

    if (
      error.message.includes("racket_products_scope_model_unique") ||
      constraintName === "racket_products_scope_model_unique"
    ) {
      return new RacketProductError(
        "DUPLICATE_MODEL",
        "Racket model already exists in this team",
        { cause: error },
      );
    }

    if (
      error.message.includes("racket_aliases_scope_alias_unique") ||
      constraintName === "racket_aliases_scope_alias_unique"
    ) {
      return new RacketProductError(
        "ALIAS_CONFLICT",
        "Racket alias already belongs to another product in this team",
        { cause: error },
      );
    }

    if (
      error.message.includes("racket_sources_scope_product_key_unique") ||
      constraintName === "racket_sources_scope_product_key_unique"
    ) {
      return new RacketProductError(
        "SOURCE_CONFLICT",
        "Racket source already exists for this product in this team",
        { cause: error },
      );
    }

    return new RacketProductError(
      "DATABASE_OPERATION_FAILED",
      getDatabaseErrorMessage(error),
      { cause: error },
    );
  }

  return new RacketProductError(
    "DATABASE_OPERATION_FAILED",
    "Unknown racket product persistence failure",
  );
}

export function createRacketProductRepository(
  database: RacketProductRepositoryDatabase,
) {
  async function getScopedProduct(
    context: DataAccessContext,
    productId: string,
  ): Promise<RacketProductRecord> {
    const [product] = await database
      .select()
      .from(racketProducts)
      .where(
        and(
          eq(racketProducts.id, productId),
          eq(racketProducts.tenantId, context.tenantId),
          eq(racketProducts.teamId, context.teamId),
        ),
      )
      .limit(1);

    if (!product) {
      throw new RacketProductError(
        "NOT_FOUND",
        "Racket product was not found in this team",
      );
    }

    return product;
  }

  async function getScopedSource(input: {
    context: DataAccessContext;
    productId: string;
    sourceId: string;
  }): Promise<RacketProductSourceRecord> {
    const [source] = await database
      .select()
      .from(racketProductSources)
      .where(
        and(
          eq(racketProductSources.id, input.sourceId),
          eq(racketProductSources.productId, input.productId),
          eq(racketProductSources.tenantId, input.context.tenantId),
          eq(racketProductSources.teamId, input.context.teamId),
        ),
      )
      .limit(1);

    if (!source) {
      throw new RacketProductError(
        "NOT_FOUND",
        "Racket product source was not found in this team",
      );
    }

    return source;
  }

  async function listAliasesForProducts(
    context: DataAccessContext,
    productIds: string[],
  ): Promise<RacketProductAliasRecord[]> {
    if (productIds.length === 0) {
      return [];
    }

    return database
      .select()
      .from(racketProductAliases)
      .where(
        and(
          eq(racketProductAliases.tenantId, context.tenantId),
          eq(racketProductAliases.teamId, context.teamId),
          inArray(racketProductAliases.productId, productIds),
        ),
      );
  }

  async function listSourcesForProducts(
    context: DataAccessContext,
    productIds: string[],
  ): Promise<RacketProductSourceRecord[]> {
    if (productIds.length === 0) {
      return [];
    }

    return database
      .select()
      .from(racketProductSources)
      .where(
        and(
          eq(racketProductSources.tenantId, context.tenantId),
          eq(racketProductSources.teamId, context.teamId),
          inArray(racketProductSources.productId, productIds),
        ),
      );
  }

  async function getProductView(
    context: DataAccessContext,
    product: RacketProductRecord,
  ): Promise<RacketProductView> {
    const aliases = await listAliasesForProducts(context, [product.id]);

    return toProductView(product, aliases);
  }

  async function updateProductStatus(input: {
    context: DataAccessContext;
    productId: string;
    status: z.infer<typeof productStatusSchema>;
    reviewedBy?: string | null;
    reviewedAt?: Date | null;
    publishedBy?: string | null;
    publishedAt?: Date | null;
    publishedVersionId?: string | null;
    sourceIds?: string[];
    changeReason?: string;
  }): Promise<RacketProductRecord> {
    const [product] = await database
      .update(racketProducts)
      .set({
        status: input.status,
        reviewedBy: input.reviewedBy,
        reviewedAt: input.reviewedAt,
        publishedBy: input.publishedBy,
        publishedAt: input.publishedAt,
        publishedVersionId: input.publishedVersionId,
        sourceIds: input.sourceIds,
        changeReason: input.changeReason,
        updatedBy: input.context.actorId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(racketProducts.id, input.productId),
          eq(racketProducts.tenantId, input.context.tenantId),
          eq(racketProducts.teamId, input.context.teamId),
        ),
      )
      .returning();

    if (!product) {
      throw new RacketProductError(
        "NOT_FOUND",
        "Racket product was not found in this team",
      );
    }

    return product;
  }

  return {
    async createRacketProduct(
      context: DataAccessContext,
      input: CreateRacketProductInput,
    ): Promise<RacketProductView> {
      assertPermission(context, ["manage_products"]);
      const values = parseInput(createProductInputSchema, input);
      const normalizedModel = normalizeLookupValue(values.model);
      const normalizedAliases = values.aliases.map((alias) =>
        normalizeLookupValue(alias.alias),
      );

      try {
        const [existingProduct] = await database
          .select({ id: racketProducts.id })
          .from(racketProducts)
          .where(
            and(
              eq(racketProducts.tenantId, context.tenantId),
              eq(racketProducts.teamId, context.teamId),
              eq(racketProducts.normalizedModel, normalizedModel),
            ),
          )
          .limit(1);

        if (existingProduct) {
          throw new RacketProductError(
            "DUPLICATE_MODEL",
            "Racket model already exists in this team",
          );
        }

        if (normalizedAliases.length > 0) {
          const [existingAlias] = await database
            .select({ id: racketProductAliases.id })
            .from(racketProductAliases)
            .where(
              and(
                eq(racketProductAliases.tenantId, context.tenantId),
                eq(racketProductAliases.teamId, context.teamId),
                inArray(
                  racketProductAliases.normalizedAlias,
                  normalizedAliases,
                ),
              ),
            )
            .limit(1);

          if (existingAlias) {
            throw new RacketProductError(
              "ALIAS_CONFLICT",
              "Racket alias already belongs to another product in this team",
            );
          }
        }

        const productId = createRecordId("racket");
        const [product] = await database
          .insert(racketProducts)
          .values({
            id: productId,
            tenantId: context.tenantId,
            teamId: context.teamId,
            brand: values.brand,
            series: values.series,
            model: values.model,
            normalizedModel,
            status: defaultProductStatus(values),
            weightClasses: values.specs.weightClasses,
            balancePoint: values.specs.balancePoint,
            balanceType: values.specs.balanceType,
            shaftStiffness: values.specs.shaftStiffness,
            recommendedTension: values.specs.recommendedTension,
            playerLevels: values.positioning.playerLevels,
            playStyles: values.positioning.playStyles,
            priceBand: values.positioning.priceBand,
            sellingFocus: values.positioning.sellingFocus,
            limitations: values.positioning.limitations,
            sourceIds: values.sourceIds,
            createdBy: context.actorId,
            updatedBy: context.actorId,
          })
          .returning();

        const aliases =
          values.aliases.length > 0
            ? await database
                .insert(racketProductAliases)
                .values(
                  values.aliases.map((alias, index) => ({
                    id: createRecordId("ralias"),
                    tenantId: context.tenantId,
                    teamId: context.teamId,
                    productId,
                    alias: alias.alias,
                    normalizedAlias: normalizedAliases[index] ?? "",
                    aliasType: alias.aliasType,
                    confidence: alias.confidence,
                    reviewState: "pending" as const,
                    createdBy: context.actorId,
                    updatedBy: context.actorId,
                  })),
                )
                .returning()
            : [];

        return toProductView(product, aliases);
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async registerRacketSource(
      context: DataAccessContext,
      input: RegisterRacketSourceInput,
    ): Promise<RacketProductSourceView> {
      assertPermission(context, ["manage_products"]);
      const values = parseInput(registerSourceInputSchema, input);

      try {
        await getScopedProduct(context, values.productId);
        const normalizedSourceKey = normalizeSourceKey(values);

        const [existingSource] = await database
          .select({ id: racketProductSources.id })
          .from(racketProductSources)
          .where(
            and(
              eq(racketProductSources.tenantId, context.tenantId),
              eq(racketProductSources.teamId, context.teamId),
              eq(racketProductSources.productId, values.productId),
              eq(racketProductSources.normalizedSourceKey, normalizedSourceKey),
            ),
          )
          .limit(1);

        if (existingSource) {
          throw new RacketProductError(
            "SOURCE_CONFLICT",
            "Racket source already exists for this product in this team",
          );
        }

        const [source] = await database
          .insert(racketProductSources)
          .values({
            id: createRecordId("rsource"),
            tenantId: context.tenantId,
            teamId: context.teamId,
            productId: values.productId,
            sourceType: values.sourceType,
            title: values.title,
            url: values.url,
            normalizedSourceKey,
            retrievedAt: values.retrievedAt,
            trustLevel: values.trustLevel,
            refreshPolicy: values.refreshPolicy,
            reviewState: "pending" as const,
            createdBy: context.actorId,
            updatedBy: context.actorId,
          })
          .returning();

        return toSourceView(source);
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async submitRacketProductForReview(
      context: DataAccessContext,
      input: z.input<typeof productIdInputSchema>,
    ): Promise<RacketProductView> {
      assertPermission(context, ["manage_products"]);
      const values = parseInput(productIdInputSchema, input);

      try {
        const product = await getScopedProduct(context, values.productId);

        if (
          !["draft", "needs_source", "reviewing"].includes(product.status)
        ) {
          throw new RacketProductError(
            "STATE_TRANSITION_INVALID",
            "Racket product cannot be submitted for review from its current state",
            {
              details: {
                currentStatus: product.status,
              },
            },
          );
        }

        const sources = await listSourcesForProducts(context, [product.id]);

        if (sources.length === 0) {
          throw new RacketProductError(
            "MISSING_SOURCE",
            "Racket product needs at least one source before review",
          );
        }

        const updated =
          product.status === "reviewing"
            ? product
            : await updateProductStatus({
                context,
                productId: product.id,
                status: "reviewing",
                changeReason: "Submitted for product source review",
              });

        return getProductView(context, updated);
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async recordRacketReviewDecision(
      context: DataAccessContext,
      input: RacketReviewDecisionInput,
    ): Promise<RacketProductView | RacketProductSourceView> {
      assertPermission(context, ["review_knowledge"]);
      const values = parseInput(reviewDecisionInputSchema, input);

      try {
        const product = await getScopedProduct(context, values.productId);
        const reviewedAt = new Date();

        if (values.targetType === "source") {
          const source = await getScopedSource({
            context,
            productId: product.id,
            sourceId: values.targetId,
          });

          if (!["approve", "reject"].includes(values.decision)) {
            throw new RacketProductError(
              "STATE_TRANSITION_INVALID",
              "Racket source only supports approve or reject decisions in this slice",
              {
                details: {
                  decision: values.decision,
                  currentReviewState: source.reviewState,
                },
              },
            );
          }

          const sourceReviewState =
            values.decision === "approve" ? "approved" : "rejected";

          const [updatedSource] = await database
            .update(racketProductSources)
            .set({
              reviewState: sourceReviewState,
              reviewedBy: context.actorId,
              reviewedAt,
              updatedBy: context.actorId,
              updatedAt: reviewedAt,
            })
            .where(
              and(
                eq(racketProductSources.id, source.id),
                eq(racketProductSources.tenantId, context.tenantId),
                eq(racketProductSources.teamId, context.teamId),
              ),
            )
            .returning();

          await database.insert(racketReviewDecisions).values({
            id: createRecordId("rreview"),
            tenantId: context.tenantId,
            teamId: context.teamId,
            productId: product.id,
            targetType: values.targetType,
            targetId: values.targetId,
            decision: values.decision,
            reason: values.reason,
            reviewedBy: context.actorId,
            requestId: context.requestId,
            reviewedAt,
          });

          return toSourceView(updatedSource);
        }

        if (values.targetId !== product.id) {
          throw new RacketProductError(
            "NOT_FOUND",
            "Racket review target does not match the product",
          );
        }

        const approvedSources = (
          await listSourcesForProducts(context, [product.id])
        ).filter((source) => source.reviewState === "approved");

        const nextStatus = (() => {
          if (values.decision === "approve") {
            if (product.status !== "reviewing") {
              throw new RacketProductError(
                "STATE_TRANSITION_INVALID",
                "Only reviewing products can be approved",
                {
                  details: {
                    currentStatus: product.status,
                  },
                },
              );
            }

            if (approvedSources.length === 0) {
              throw new RacketProductError(
                "MISSING_SOURCE",
                "Racket product needs an approved source before approval",
              );
            }

            return "approved" as const;
          }

          if (values.decision === "reject") {
            if (product.status !== "reviewing") {
              throw new RacketProductError(
                "STATE_TRANSITION_INVALID",
                "Only reviewing products can be rejected",
                {
                  details: {
                    currentStatus: product.status,
                  },
                },
              );
            }

            return "rejected" as const;
          }

          if (values.decision === "request_source") {
            return "needs_source" as const;
          }

          if (values.decision === "mark_conflict") {
            return "conflict" as const;
          }

          return "archived" as const;
        })();

        await database.insert(racketReviewDecisions).values({
          id: createRecordId("rreview"),
          tenantId: context.tenantId,
          teamId: context.teamId,
          productId: product.id,
          targetType: values.targetType,
          targetId: values.targetId,
          decision: values.decision,
          reason: values.reason,
          reviewedBy: context.actorId,
          requestId: context.requestId,
          reviewedAt,
        });

        const updatedProduct = await updateProductStatus({
          context,
          productId: product.id,
          status: nextStatus,
          reviewedBy: context.actorId,
          reviewedAt,
          changeReason: values.reason,
        });

        return getProductView(context, updatedProduct);
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async publishRacketProduct(
      context: DataAccessContext,
      input: PublishRacketProductInput,
    ): Promise<RacketProductView> {
      assertPermission(context, ["review_knowledge"]);
      const values = parseInput(publishProductInputSchema, input);

      try {
        const product = await getScopedProduct(context, values.productId);

        if (product.status !== "approved") {
          throw new RacketProductError(
            "STATE_TRANSITION_INVALID",
            "Only approved racket products can be published",
            {
              details: {
                currentStatus: product.status,
              },
            },
          );
        }

        const approvedSources = (
          await listSourcesForProducts(context, [product.id])
        ).filter((source) => source.reviewState === "approved");

        if (approvedSources.length === 0) {
          throw new RacketProductError(
            "MISSING_SOURCE",
            "Racket product needs an approved source before publishing",
          );
        }

        const publishedAt = new Date();
        const updatedProduct = await updateProductStatus({
          context,
          productId: product.id,
          status: "published",
          publishedBy: context.actorId,
          publishedAt,
          publishedVersionId: createRecordId("rpub"),
          sourceIds: approvedSources.map((source) => source.id),
          changeReason: values.changeReason,
        });

        return getProductView(context, updatedProduct);
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async listRacketProducts(
      context: DataAccessContext,
      input?: ListRacketProductsInput,
    ): Promise<RacketProductListResult> {
      assertPermission(context, ["read_workspace", "manage_products"]);
      const values = parseInput(listProductInputSchema, input ?? {});

      try {
        const products = await database
          .select()
          .from(racketProducts)
          .where(
            and(
              eq(racketProducts.tenantId, context.tenantId),
              eq(racketProducts.teamId, context.teamId),
              values.status && values.status.length > 0
                ? inArray(racketProducts.status, values.status)
                : undefined,
            ),
          )
          .orderBy(desc(racketProducts.createdAt))
          .limit(values.limit);

        if (products.length === 0) {
          return { items: [] };
        }

        const aliases = await database
          .select()
          .from(racketProductAliases)
          .where(
            and(
              eq(racketProductAliases.tenantId, context.tenantId),
              eq(racketProductAliases.teamId, context.teamId),
              inArray(
                racketProductAliases.productId,
                products.map((product) => product.id),
              ),
            ),
          );

        return {
          items: products
            .filter((product) => {
              if (!values.search) {
                return true;
              }

              const normalizedSearch = normalizeLookupValue(values.search);
              const productAliases = aliases.filter(
                (alias) => alias.productId === product.id,
              );

              return (
                product.normalizedModel.includes(normalizedSearch) ||
                product.brand
                  .toLocaleLowerCase()
                  .includes(values.search.toLocaleLowerCase()) ||
                productAliases.some((alias) =>
                  alias.normalizedAlias.includes(normalizedSearch),
                )
              );
            })
            .map((product) =>
              toProductView(
                product,
                aliases.filter((alias) => alias.productId === product.id),
              ),
            ),
        };
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async listRacketReviewQueue(
      context: DataAccessContext,
      input?: ListRacketReviewQueueInput,
    ): Promise<RacketReviewQueueResult> {
      assertPermission(context, [
        "read_workspace",
        "manage_products",
        "review_knowledge",
      ]);
      const values = parseInput(reviewQueueInputSchema, input ?? {});

      try {
        const products = await database
          .select()
          .from(racketProducts)
          .where(
            and(
              eq(racketProducts.tenantId, context.tenantId),
              eq(racketProducts.teamId, context.teamId),
              inArray(racketProducts.status, [
                "draft",
                "needs_source",
                "reviewing",
                "approved",
                "stale",
                "conflict",
                "rejected",
              ]),
            ),
          )
          .orderBy(desc(racketProducts.createdAt))
          .limit(values.limit);

        if (products.length === 0) {
          return { items: [] };
        }

        const productIds = products.map((product) => product.id);
        const aliases = await listAliasesForProducts(context, productIds);
        const sources = await listSourcesForProducts(context, productIds);

        return {
          items: products.map((product) => {
            const productAliases = aliases.filter(
              (alias) => alias.productId === product.id,
            );
            const productSources = sources.filter(
              (source) => source.productId === product.id,
            );

            return {
              product: toProductView(product, productAliases),
              sourceSummary: summarizeSources(productSources),
            };
          }),
        };
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },
  };
}
