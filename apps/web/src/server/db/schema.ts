import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const tenantStatusEnum = pgEnum("tenant_status", [
  "active",
  "suspended",
  "archived",
]);

export const teamTypeEnum = pgEnum("team_type", [
  "live_operations",
  "product_team",
  "review_team",
  "admin_team",
]);

export const teamStatusEnum = pgEnum("team_status", [
  "active",
  "suspended",
  "archived",
]);

export const userStatusEnum = pgEnum("app_user_status", [
  "active",
  "pending",
  "suspended",
  "deleted",
]);

export const membershipStatusEnum = pgEnum("membership_status", [
  "invited",
  "active",
  "suspended",
  "removed",
  "expired",
  "archived",
]);

export const tenantRoleEnum = pgEnum("tenant_role", [
  "owner",
  "admin",
  "member",
  "viewer",
]);

export const teamRoleEnum = pgEnum("team_role", [
  "operator",
  "host",
  "product_owner",
  "reviewer",
  "admin",
  "viewer",
]);

export const rolePermissionEnum = pgEnum("role_permission", [
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

export const authSessionStatusEnum = pgEnum("auth_session_status", [
  "active",
  "expired",
  "revoked",
  "invalidated",
  "archived",
]);

export const authSessionInvalidationReasonEnum = pgEnum(
  "auth_session_invalidation_reason",
  [
    "logout",
    "membership_removed",
    "role_changed",
    "security_event",
    "provider_revoked",
    "expired",
    "unknown",
  ],
);

export const permissionScopeEnum = pgEnum("permission_scope", [
  "tenant",
  "team",
  "own_records",
]);

export const idempotencyStatusEnum = pgEnum("idempotency_status", [
  "pending",
  "completed",
  "conflict",
  "expired",
]);

export const racketProductStatusEnum = pgEnum("racket_product_status", [
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

export const racketBalanceTypeEnum = pgEnum("racket_balance_type", [
  "head_light",
  "even",
  "head_heavy",
  "unknown",
]);

export const racketAliasTypeEnum = pgEnum("racket_alias_type", [
  "official_en",
  "official_cn",
  "series_short",
  "live_spoken",
  "common_typo",
  "team_note",
]);

export const racketAliasConfidenceEnum = pgEnum("racket_alias_confidence", [
  "high",
  "medium",
  "low",
]);

export const racketReviewStateEnum = pgEnum("racket_review_state", [
  "pending",
  "approved",
  "rejected",
  "conflict",
]);

export const racketSourceTypeEnum = pgEnum("racket_source_type", [
  "official_site",
  "brand_catalog",
  "commerce_page",
  "team_note",
  "manual_review",
]);

export const racketSourceTrustLevelEnum = pgEnum("racket_source_trust_level", [
  "official",
  "commerce",
  "team",
  "unknown",
]);

export const racketSourceRefreshPolicyEnum = pgEnum(
  "racket_source_refresh_policy",
  ["manual", "monthly", "quarterly", "on_demand"],
);

export const racketSourceReviewStateEnum = pgEnum(
  "racket_source_review_state",
  ["pending", "approved", "rejected", "stale"],
);

export const racketReviewTargetTypeEnum = pgEnum("racket_review_target_type", [
  "product",
  "alias",
  "source",
  "selling_point",
  "comparison",
]);

export const racketReviewDecisionEnum = pgEnum("racket_review_decision", [
  "approve",
  "reject",
  "request_source",
  "mark_conflict",
  "archive",
]);

export const sessionCaptureStatusEnum = pgEnum("session_capture_status", [
  "draft",
  "autosaved",
  "submitted",
  "review_ready",
  "processing",
  "processed",
  "failed",
  "archived",
  "deleted",
]);

export const sessionPlatformEnum = pgEnum("session_platform", [
  "douyin",
  "kuaishou",
  "video_account",
  "offline_notes",
  "other",
]);

export const sessionSourceModeEnum = pgEnum("session_source_mode", [
  "manual",
  "transcript_import",
  "mixed",
]);

export const sessionHostRoleEnum = pgEnum("session_host_role", [
  "host",
  "assistant",
  "operator",
  "product_specialist",
  "reviewer",
]);

export const sessionProductRoleEnum = pgEnum("session_product_role", [
  "opening_compare",
  "main_offer",
  "objection_bridge",
  "alternative",
  "closing_push",
]);

export const sessionEvidenceStateEnum = pgEnum("session_evidence_state", [
  "linked_product",
  "manual_only",
  "needs_review",
]);

export const sessionNoteTypeEnum = pgEnum("session_note_type", [
  "opening",
  "product_explanation",
  "customer_question",
  "objection",
  "deal_signal",
  "gap",
  "follow_up",
]);

export const sessionNoteSourceEnum = pgEnum("session_note_source", [
  "manual",
  "transcript_excerpt",
  "operator_summary",
]);

export const sessionReviewStateEnum = pgEnum("session_review_state", [
  "unreviewed",
  "reviewed",
  "needs_clarification",
]);

export const customerQuestionTopicEnum = pgEnum("customer_question_topic", [
  "fit",
  "tension",
  "weight",
  "balance",
  "price",
  "durability",
  "comparison",
  "after_sales",
  "other",
]);

export const customerSensitiveRedactionStateEnum = pgEnum(
  "customer_sensitive_redaction_state",
  ["not_needed", "redacted", "needs_review"],
);

export const customerObjectionTypeEnum = pgEnum("customer_objection_type", [
  "price",
  "skill_level",
  "too_stiff",
  "too_head_heavy",
  "durability",
  "similar_owned",
  "trust",
  "other",
]);

export const customerObjectionResolvedStateEnum = pgEnum(
  "customer_objection_resolved_state",
  ["resolved", "partially_resolved", "unresolved", "unknown"],
);

export const knowledgeSourceTypeEnum = pgEnum("knowledge_source_type", [
  "official_brand",
  "official_platform",
  "official_sport_rule",
  "authorized_retailer",
  "academic_research",
  "team_note",
  "web_discovery",
]);

export const knowledgeTrustLevelEnum = pgEnum("knowledge_trust_level", [
  "official",
  "authorized",
  "research",
  "team",
  "unknown",
]);

export const knowledgeSourceReviewStateEnum = pgEnum(
  "knowledge_source_review_state",
  [
    "registered",
    "extracting",
    "reviewing",
    "approved",
    "rejected",
    "stale",
    "conflict",
    "archived",
  ],
);

export const knowledgeRefreshCadenceEnum = pgEnum(
  "knowledge_refresh_cadence",
  ["manual", "monthly", "quarterly", "on_demand"],
);

export const knowledgeClaimTypeEnum = pgEnum("knowledge_claim_type", [
  "racket_spec",
  "platform_rule",
  "sales_guidance",
  "customer_question",
  "objection_reply",
  "metric_definition",
  "team_experience",
]);

export const knowledgeLanguageEnum = pgEnum("knowledge_language", [
  "zh",
  "en",
  "mixed",
  "unknown",
]);

export const knowledgeConfidenceEnum = pgEnum("knowledge_confidence", [
  "high",
  "medium",
  "low",
  "unknown",
]);

export const knowledgeExtractionMethodEnum = pgEnum(
  "knowledge_extraction_method",
  ["manual", "ai_candidate", "imported"],
);

export const knowledgeClaimReviewStateEnum = pgEnum(
  "knowledge_claim_review_state",
  ["pending", "approved", "rejected", "conflict", "needs_source"],
);

export const teamKnowledgeNoteTypeEnum = pgEnum("team_knowledge_note_type", [
  "selling_experience",
  "talk_track",
  "objection_reply",
  "after_sales",
  "pricing_guidance",
  "workflow_note",
]);

export const knowledgeSensitiveLevelEnum = pgEnum(
  "knowledge_sensitive_level",
  ["internal", "restricted", "high"],
);

export const teamKnowledgeReviewStateEnum = pgEnum(
  "team_knowledge_review_state",
  ["draft", "reviewing", "approved", "rejected", "archived"],
);

export const knowledgeReviewTargetTypeEnum = pgEnum(
  "knowledge_review_target_type",
  ["source", "claim", "team_note", "conflict", "ai_finding", "feedback_signal"],
);

export const knowledgeReviewDecisionEnum = pgEnum(
  "knowledge_review_decision",
  [
    "approve",
    "reject",
    "request_source",
    "mark_conflict",
    "mark_stale",
    "publish",
    "archive",
  ],
);

export const publishedKnowledgeStatusEnum = pgEnum(
  "published_knowledge_status",
  ["published", "stale", "superseded", "conflict_blocked", "archived"],
);

export const knowledgeConflictTypeEnum = pgEnum("knowledge_conflict_type", [
  "spec_mismatch",
  "rule_change",
  "source_priority",
  "team_note_conflict",
  "stale_source",
]);

export const knowledgeConflictSeverityEnum = pgEnum(
  "knowledge_conflict_severity",
  ["low", "medium", "high"],
);

export const knowledgeConflictResolutionStateEnum = pgEnum(
  "knowledge_conflict_resolution_state",
  ["open", "reviewing", "resolved", "ignored"],
);

export const nextSessionTaskTypeEnum = pgEnum("next_session_task_type", [
  "prepare_product_info",
  "fix_talk_track",
  "review_knowledge_gap",
  "follow_up_question",
  "plan_short_video",
  "update_session_theme",
  "assign_review",
  "export_or_report",
  "other",
]);

export const nextSessionTaskPriorityEnum = pgEnum(
  "next_session_task_priority",
  ["low", "normal", "high", "urgent"],
);

export const nextSessionTaskStatusEnum = pgEnum("next_session_task_status", [
  "draft",
  "assigned",
  "in_progress",
  "blocked",
  "done",
  "reviewing",
  "closed",
  "reopened",
  "canceled",
  "archived",
]);

export const nextSessionTaskSourceWorkflowEnum = pgEnum(
  "next_session_task_source_workflow",
  [
    "session_capture",
    "ai_review",
    "knowledge_gap",
    "talk_track",
    "qa_feedback",
    "manual",
  ],
);

export const nextSessionTaskSourceStateEnum = pgEnum(
  "next_session_task_source_state",
  [
    "draft",
    "candidate",
    "review_ready",
    "accepted",
    "partially_accepted",
    "manual",
    "rejected",
    "provider_failed",
    "validation_failed",
  ],
);

export const nextSessionTaskDeadlinePolicyEnum = pgEnum(
  "next_session_task_deadline_policy",
  ["absolute", "before_next_session", "no_due_date"],
);

export const nextSessionTaskRedactionStateEnum = pgEnum(
  "next_session_task_redaction_state",
  ["not_needed", "redacted", "needs_review", "blocked"],
);

export const nextSessionTaskAssigneeRoleEnum = pgEnum(
  "next_session_task_assignee_role",
  ["owner", "collaborator", "reviewer", "watcher"],
);

export const nextSessionTaskAssignmentStateEnum = pgEnum(
  "next_session_task_assignment_state",
  ["active", "inactive", "transferred", "removed"],
);

export const nextSessionTaskChecklistStatusEnum = pgEnum(
  "next_session_task_checklist_status",
  ["todo", "done", "blocked", "canceled"],
);

export const nextSessionTaskDependencyTypeEnum = pgEnum(
  "next_session_task_dependency_type",
  ["task", "session", "product", "knowledge_version", "talk_track", "review_decision"],
);

export const nextSessionTaskDependencyStateEnum = pgEnum(
  "next_session_task_dependency_state",
  ["pending", "satisfied", "blocked", "waived"],
);

export const nextSessionTaskReviewDecisionEnum = pgEnum(
  "next_session_task_review_decision",
  ["approve_close", "request_changes", "reject_result", "reopen", "cancel"],
);

export const nextSessionTaskFeedbackSignalEnum = pgEnum(
  "next_session_task_feedback_signal",
  [
    "completed",
    "reopened",
    "blocked",
    "duplicate",
    "not_useful",
    "helped_next_session",
    "missed_due_date",
    "needs_better_source",
  ],
);

export const nextSessionTaskFeedbackRouteEnum = pgEnum(
  "next_session_task_feedback_route",
  ["team_review", "knowledge_review", "prompt_review", "workflow_review", "none"],
);

export const talkTrackAssetTypeEnum = pgEnum("talk_track_asset_type", [
  "product_intro",
  "feature_benefit",
  "comparison",
  "objection_reply",
  "closing_prompt",
  "short_video_hook",
  "transition",
  "qa_reply",
]);

export const talkTrackStatusEnum = pgEnum("talk_track_status", [
  "draft",
  "reviewing",
  "published",
  "deprecated",
  "archived",
  "rejected",
]);

export const talkTrackOwnerRoleEnum = pgEnum("talk_track_owner_role", [
  "operator",
  "host",
  "product_owner",
  "reviewer",
  "admin",
]);

export const talkTrackToneEnum = pgEnum("talk_track_tone", [
  "professional",
  "friendly",
  "urgent",
  "educational",
  "comparison",
]);

export const talkTrackLanguageEnum = pgEnum("talk_track_language", [
  "zh_CN",
  "mixed_zh_en",
]);

export const talkTrackPlayerLevelEnum = pgEnum("talk_track_player_level", [
  "beginner",
  "intermediate",
  "advanced",
  "professional",
  "unknown",
]);

export const talkTrackPlayStyleEnum = pgEnum("talk_track_play_style", [
  "control",
  "attack",
  "defense",
  "doubles",
  "singles",
  "all_round",
  "unknown",
]);

export const talkTrackPriceBandEnum = pgEnum("talk_track_price_band", [
  "entry",
  "mid",
  "premium",
  "unknown",
]);

export const talkTrackLiveSceneEnum = pgEnum("talk_track_live_scene", [
  "opening",
  "product_demo",
  "comparison",
  "objection_handling",
  "closing",
  "short_video",
  "qa",
]);

export const talkTrackHostRoleEnum = pgEnum("talk_track_host_role", [
  "host",
  "assistant",
  "operator",
]);

export const talkTrackSegmentTypeEnum = pgEnum("talk_track_segment_type", [
  "hook",
  "product_fact",
  "benefit",
  "demo_step",
  "comparison_point",
  "objection_reply",
  "cta",
  "transition",
]);

export const talkTrackObjectionTypeEnum = pgEnum(
  "talk_track_objection_type",
  [
    "price",
    "beginner_fit",
    "durability",
    "weight",
    "stiffness",
    "string_tension",
    "authenticity",
    "comparison",
    "after_sales",
  ],
);

export const talkTrackReplyStrategyEnum = pgEnum(
  "talk_track_reply_strategy",
  [
    "clarify_need",
    "compare_options",
    "explain_tradeoff",
    "recommend_alternative",
    "defer_to_review",
  ],
);

export const talkTrackRiskLevelEnum = pgEnum("talk_track_risk_level", [
  "low",
  "medium",
  "high",
]);

export const talkTrackSourceTypeEnum = pgEnum("talk_track_source_type", [
  "racket_product_version",
  "knowledge_version",
  "session_example",
  "ai_review_run",
  "team_experience",
]);

export const talkTrackFreshnessStateEnum = pgEnum(
  "talk_track_freshness_state",
  ["current", "stale_warning", "stale_blocked", "unknown"],
);

export const talkTrackConflictStateEnum = pgEnum(
  "talk_track_conflict_state",
  ["none", "needs_review", "blocked"],
);

export const talkTrackReviewDecisionEnum = pgEnum(
  "talk_track_review_decision",
  ["approve", "approve_with_edits", "reject", "request_changes", "deprecate"],
);

export const talkTrackCandidateSourceEnum = pgEnum(
  "talk_track_candidate_source",
  ["ai_review", "session_capture", "manual", "qa_feedback"],
);

export const talkTrackValidationStateEnum = pgEnum(
  "talk_track_validation_state",
  ["unchecked", "passed", "warning", "blocked"],
);

export const talkTrackCandidateReviewStateEnum = pgEnum(
  "talk_track_candidate_review_state",
  ["pending", "accepted", "edited", "rejected", "published", "archived"],
);

export const talkTrackUsageWorkflowEnum = pgEnum("talk_track_usage_workflow", [
  "live_session",
  "ai_review",
  "qa_answer",
  "short_video",
  "manual",
]);

export const talkTrackUsageSignalEnum = pgEnum("talk_track_usage_signal", [
  "used",
  "edited_before_use",
  "rejected_in_use",
  "reported_wrong",
  "needs_update",
]);

export const talkTrackSensitiveRedactionStateEnum = pgEnum(
  "talk_track_sensitive_redaction_state",
  ["not_needed", "redacted", "needs_review", "blocked"],
);

export const aiReviewRunStatusEnum = pgEnum("ai_review_run_status", [
  "draft",
  "input_ready",
  "blocked",
  "queued",
  "generating",
  "provider_failed",
  "validating",
  "validation_failed",
  "review_ready",
  "reviewing",
  "accepted",
  "partially_accepted",
  "rejected",
  "regeneration_requested",
  "regenerated",
  "downstream_ready",
  "archived",
]);

export const aiReviewRunTypeEnum = pgEnum("ai_review_run_type", [
  "initial_review",
  "regeneration",
  "section_regeneration",
  "manual_import",
]);

export const aiReviewRequestedSectionEnum = pgEnum(
  "ai_review_requested_section",
  [
    "live_recap",
    "product_diagnosis",
    "question_cluster",
    "objection_pattern",
    "talk_track_candidate",
    "short_video_topic",
    "next_session_action",
  ],
);

export const aiReviewRedactionStateEnum = pgEnum(
  "ai_review_redaction_state",
  ["not_needed", "redacted", "needs_review", "blocked"],
);

export const aiReviewLongInputPolicyEnum = pgEnum(
  "ai_review_long_input_policy",
  ["within_limit", "chunked", "truncated_with_notice", "blocked"],
);

export const aiReviewKnowledgeConflictStateEnum = pgEnum(
  "ai_review_knowledge_conflict_state",
  ["none", "low_risk", "blocked"],
);

export const aiReviewKnowledgeFreshnessStateEnum = pgEnum(
  "ai_review_knowledge_freshness_state",
  ["current", "stale_warning", "stale_blocked"],
);

export const aiReviewKnowledgeReviewStateEnum = pgEnum(
  "ai_review_knowledge_review_state",
  ["published_only", "approved_candidates", "insufficient", "blocked"],
);

export const aiReviewPromptPurposeEnum = pgEnum("ai_review_prompt_purpose", [
  "full_review",
  "section_regeneration",
  "validation",
]);

export const aiReviewPromptStatusEnum = pgEnum("ai_review_prompt_status", [
  "draft",
  "reviewed",
  "active",
  "deprecated",
]);

export const aiReviewConfidenceEnum = pgEnum("ai_review_confidence", [
  "high",
  "medium",
  "low",
  "unknown",
]);

export const aiReviewSectionTypeEnum = pgEnum("ai_review_section_type", [
  "live_recap",
  "product_diagnosis",
  "question_cluster",
  "objection_pattern",
  "talk_track_candidate",
  "short_video_topic",
  "next_session_action",
]);

export const aiReviewSectionReviewStateEnum = pgEnum(
  "ai_review_section_review_state",
  ["pending", "accepted", "edited", "rejected", "regenerate_requested"],
);

export const aiReviewValidationCheckTypeEnum = pgEnum(
  "ai_review_validation_check_type",
  [
    "schema",
    "empty_section",
    "source_grounding",
    "stale_source",
    "sensitive_data",
    "fact_conflict",
    "long_input",
    "policy",
  ],
);

export const aiReviewValidationStatusEnum = pgEnum(
  "ai_review_validation_status",
  ["passed", "warning", "failed", "blocked"],
);

export const aiReviewDecisionTargetTypeEnum = pgEnum(
  "ai_review_decision_target_type",
  ["run", "section", "item"],
);

export const aiReviewDecisionEnum = pgEnum("ai_review_decision", [
  "accept",
  "edit_accept",
  "reject",
  "request_regeneration",
  "mark_needs_source",
]);

export const aiReviewFeedbackSignalEnum = pgEnum(
  "ai_review_feedback_signal",
  [
    "accepted",
    "edited",
    "rejected",
    "regenerated",
    "missing_knowledge",
    "wrong_source",
    "evidence_weak",
    "downstream_used",
  ],
);

export const aiReviewPriorityEnum = pgEnum("ai_review_priority", [
  "low",
  "normal",
  "high",
  "urgent",
]);

export const aiReviewFeedbackRouteEnum = pgEnum(
  "ai_review_feedback_route",
  ["evaluation_set", "knowledge_review", "prompt_review", "none"],
);

export const aiReviewDownstreamArtifactTypeEnum = pgEnum(
  "ai_review_downstream_artifact_type",
  ["talk_track", "short_video_topic", "next_session_task", "knowledge_gap"],
);

export const aiReviewDownstreamArtifactStatusEnum = pgEnum(
  "ai_review_downstream_artifact_status",
  ["draft", "reviewing", "accepted", "archived"],
);

export const v0TrialFeedbackEvaluatorRoleEnum = pgEnum(
  "v0_trial_feedback_evaluator_role",
  [
    "live_operator",
    "host_assistant",
    "product_owner",
    "team_lead",
    "reviewer",
    "other",
  ],
);

export const v0TrialFeedbackWorkbenchEnum = pgEnum(
  "v0_trial_feedback_workbench",
  [
    "overview",
    "trial",
    "sessions",
    "rackets",
    "knowledge",
    "ai_review",
    "talk_tracks",
    "next_actions",
  ],
);

export const v0TrialFeedbackIssueTypeEnum = pgEnum(
  "v0_trial_feedback_issue_type",
  [
    "copy_confusion",
    "missing_data",
    "ai_quality",
    "workflow_break",
    "mobile_layout",
    "source_trust",
    "downstream_action",
    "performance",
    "other",
  ],
);

export const v0TrialFeedbackRealWorkSignalEnum = pgEnum(
  "v0_trial_feedback_real_work_signal",
  ["yes", "maybe", "no", "not_sure"],
);

const auditMetadataDefault = sql`'{}'::jsonb`;
const stringArrayDefault = sql`'[]'::jsonb`;

export const tenants = pgTable(
  "tenants",
  {
    id: text("id").primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    status: tenantStatusEnum("status").notNull().default("active"),
    defaultTeamId: text("default_team_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("tenants_status_idx").on(table.status),
    index("tenants_default_team_id_idx").on(table.defaultTeamId),
  ],
);

export const teams = pgTable(
  "teams",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    teamType: teamTypeEnum("team_type").notNull().default("live_operations"),
    status: teamStatusEnum("status").notNull().default("active"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("teams_tenant_id_idx").on(table.tenantId),
    index("teams_tenant_status_idx").on(table.tenantId, table.status),
    uniqueIndex("teams_tenant_name_unique").on(table.tenantId, table.name),
  ],
);

export const appUsers = pgTable(
  "app_users",
  {
    id: text("id").primaryKey(),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    primaryEmail: varchar("primary_email", { length: 320 }).notNull(),
    status: userStatusEnum("status").notNull().default("pending"),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("app_users_primary_email_unique").on(table.primaryEmail),
    index("app_users_status_idx").on(table.status),
  ],
);

export const tenantMemberships = pgTable(
  "tenant_memberships",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    status: membershipStatusEnum("status").notNull().default("invited"),
    tenantRole: tenantRoleEnum("tenant_role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true }),
    removedAt: timestamp("removed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("tenant_memberships_tenant_id_idx").on(table.tenantId),
    index("tenant_memberships_user_id_idx").on(table.userId),
    index("tenant_memberships_tenant_status_idx").on(
      table.tenantId,
      table.status,
    ),
    uniqueIndex("tenant_memberships_tenant_user_unique").on(
      table.tenantId,
      table.userId,
    ),
  ],
);

export const teamMemberships = pgTable(
  "team_memberships",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    status: membershipStatusEnum("status").notNull().default("invited"),
    role: teamRoleEnum("role").notNull().default("viewer"),
    permissionOverrides: jsonb("permission_overrides")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    joinedAt: timestamp("joined_at", { withTimezone: true }),
    lastRoleChangedAt: timestamp("last_role_changed_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("team_memberships_tenant_id_idx").on(table.tenantId),
    index("team_memberships_team_id_idx").on(table.teamId),
    index("team_memberships_user_id_idx").on(table.userId),
    index("team_memberships_team_status_idx").on(table.teamId, table.status),
    index("team_memberships_team_role_idx").on(table.teamId, table.role),
    uniqueIndex("team_memberships_team_user_unique").on(
      table.teamId,
      table.userId,
    ),
  ],
);

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    sessionReferenceHash: varchar("session_reference_hash", {
      length: 128,
    }).notNull(),
    providerSessionId: varchar("provider_session_id", { length: 160 }),
    status: authSessionStatusEnum("status").notNull().default("active"),
    issuedAt: timestamp("issued_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
    invalidatedReason: authSessionInvalidationReasonEnum(
      "invalidated_reason",
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("auth_sessions_reference_hash_unique").on(
      table.sessionReferenceHash,
    ),
    index("auth_sessions_user_status_idx").on(table.userId, table.status),
    index("auth_sessions_expires_at_idx").on(table.expiresAt),
    index("auth_sessions_provider_session_idx").on(table.providerSessionId),
  ],
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: text("id").primaryKey(),
    role: teamRoleEnum("role").notNull(),
    permission: rolePermissionEnum("permission").notNull(),
    scope: permissionScopeEnum("scope").notNull().default("team"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("role_permissions_role_permission_scope_unique").on(
      table.role,
      table.permission,
      table.scope,
    ),
    index("role_permissions_role_active_idx").on(table.role, table.active),
  ],
);

export const dataAuditEvents = pgTable(
  "data_audit_events",
  {
    id: text("id").primaryKey(),
    eventType: varchar("event_type", { length: 80 }).notNull(),
    actorId: text("actor_id").references(() => appUsers.id, {
      onDelete: "set null",
    }),
    tenantId: text("tenant_id").references(() => tenants.id, {
      onDelete: "set null",
    }),
    teamId: text("team_id").references(() => teams.id, {
      onDelete: "set null",
    }),
    targetType: varchar("target_type", { length: 80 }),
    targetId: text("target_id"),
    requestId: varchar("request_id", { length: 120 }).notNull(),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(auditMetadataDefault),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("data_audit_events_tenant_team_idx").on(table.tenantId, table.teamId),
    index("data_audit_events_actor_id_idx").on(table.actorId),
    index("data_audit_events_target_idx").on(table.targetType, table.targetId),
    index("data_audit_events_request_id_idx").on(table.requestId),
    index("data_audit_events_created_at_idx").on(table.createdAt),
  ],
);

export const idempotencyRecords = pgTable(
  "idempotency_records",
  {
    id: text("id").primaryKey(),
    idempotencyKey: varchar("idempotency_key", { length: 160 }).notNull(),
    requestHash: varchar("request_hash", { length: 128 }).notNull(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    actorId: text("actor_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    targetType: varchar("target_type", { length: 80 }),
    targetId: text("target_id"),
    status: idempotencyStatusEnum("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("idempotency_records_scope_key_unique").on(
      table.tenantId,
      table.teamId,
      table.actorId,
      table.idempotencyKey,
    ),
    index("idempotency_records_tenant_team_status_idx").on(
      table.tenantId,
      table.teamId,
      table.status,
    ),
    index("idempotency_records_expires_at_idx").on(table.expiresAt),
    index("idempotency_records_target_idx").on(
      table.targetType,
      table.targetId,
    ),
  ],
);

export const v0TrialFeedback = pgTable(
  "v0_trial_feedback",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    actorId: text("actor_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    evaluatorRole:
      v0TrialFeedbackEvaluatorRoleEnum("evaluator_role").notNull(),
    workbench: v0TrialFeedbackWorkbenchEnum("workbench").notNull(),
    pagePath: varchar("page_path", { length: 160 }).notNull().default(""),
    usefulnessRating: integer("usefulness_rating").notNull(),
    clarityRating: integer("clarity_rating").notNull(),
    issueType: v0TrialFeedbackIssueTypeEnum("issue_type").notNull(),
    note: text("note").notNull(),
    realWorkSignal: v0TrialFeedbackRealWorkSignalEnum("real_work_signal"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(auditMetadataDefault),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("v0_trial_feedback_tenant_team_created_idx").on(
      table.tenantId,
      table.teamId,
      table.createdAt,
    ),
    index("v0_trial_feedback_tenant_team_workbench_idx").on(
      table.tenantId,
      table.teamId,
      table.workbench,
    ),
    index("v0_trial_feedback_tenant_team_issue_idx").on(
      table.tenantId,
      table.teamId,
      table.issueType,
    ),
    index("v0_trial_feedback_actor_idx").on(table.actorId),
  ],
);

export const racketProducts = pgTable(
  "racket_products",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    brand: varchar("brand", { length: 120 }).notNull(),
    series: varchar("series", { length: 120 }).notNull().default(""),
    model: varchar("model", { length: 180 }).notNull(),
    normalizedModel: varchar("normalized_model", { length: 180 }).notNull(),
    status: racketProductStatusEnum("status").notNull().default("needs_source"),
    weightClasses: jsonb("weight_classes")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    balancePoint: varchar("balance_point", { length: 120 }).notNull().default(""),
    balanceType: racketBalanceTypeEnum("balance_type")
      .notNull()
      .default("unknown"),
    shaftStiffness: varchar("shaft_stiffness", { length: 120 })
      .notNull()
      .default(""),
    recommendedTension: varchar("recommended_tension", { length: 120 })
      .notNull()
      .default(""),
    playerLevels: jsonb("player_levels")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    playStyles: jsonb("play_styles")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    priceBand: varchar("price_band", { length: 120 }).notNull().default(""),
    sellingFocus: jsonb("selling_focus")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    limitations: jsonb("limitations")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    sourceIds: jsonb("source_ids")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    publishedVersionId: text("published_version_id"),
    reviewedBy: text("reviewed_by").references(() => appUsers.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    publishedBy: text("published_by").references(() => appUsers.id, {
      onDelete: "set null",
    }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    changeReason: varchar("change_reason", { length: 500 }).notNull().default(""),
    createdBy: text("created_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    updatedBy: text("updated_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("racket_products_scope_model_unique").on(
      table.tenantId,
      table.teamId,
      table.normalizedModel,
    ),
    index("racket_products_tenant_team_status_idx").on(
      table.tenantId,
      table.teamId,
      table.status,
    ),
    index("racket_products_tenant_team_created_at_idx").on(
      table.tenantId,
      table.teamId,
      table.createdAt,
    ),
  ],
);

export const racketProductAliases = pgTable(
  "racket_product_aliases",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => racketProducts.id, { onDelete: "cascade" }),
    alias: varchar("alias", { length: 180 }).notNull(),
    normalizedAlias: varchar("normalized_alias", { length: 180 }).notNull(),
    aliasType: racketAliasTypeEnum("alias_type").notNull(),
    confidence: racketAliasConfidenceEnum("confidence")
      .notNull()
      .default("medium"),
    reviewState: racketReviewStateEnum("review_state")
      .notNull()
      .default("pending"),
    createdBy: text("created_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    updatedBy: text("updated_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("racket_aliases_scope_alias_unique").on(
      table.tenantId,
      table.teamId,
      table.normalizedAlias,
    ),
    index("racket_aliases_product_id_idx").on(table.productId),
    index("racket_aliases_tenant_team_review_idx").on(
      table.tenantId,
      table.teamId,
      table.reviewState,
    ),
  ],
);

export const racketProductSources = pgTable(
  "racket_product_sources",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => racketProducts.id, { onDelete: "cascade" }),
    sourceType: racketSourceTypeEnum("source_type").notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    url: varchar("url", { length: 2048 }).notNull().default(""),
    normalizedSourceKey: varchar("normalized_source_key", { length: 320 })
      .notNull(),
    retrievedAt: timestamp("retrieved_at", { withTimezone: true }).notNull(),
    trustLevel: racketSourceTrustLevelEnum("trust_level")
      .notNull()
      .default("unknown"),
    refreshPolicy: racketSourceRefreshPolicyEnum("refresh_policy")
      .notNull()
      .default("manual"),
    reviewState: racketSourceReviewStateEnum("review_state")
      .notNull()
      .default("pending"),
    reviewedBy: text("reviewed_by").references(() => appUsers.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdBy: text("created_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    updatedBy: text("updated_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("racket_sources_scope_product_key_unique").on(
      table.tenantId,
      table.teamId,
      table.productId,
      table.normalizedSourceKey,
    ),
    index("racket_sources_product_id_idx").on(table.productId),
    index("racket_sources_tenant_team_review_idx").on(
      table.tenantId,
      table.teamId,
      table.reviewState,
    ),
    index("racket_sources_tenant_team_trust_idx").on(
      table.tenantId,
      table.teamId,
      table.trustLevel,
    ),
  ],
);

export const racketReviewDecisions = pgTable(
  "racket_review_decisions",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => racketProducts.id, { onDelete: "cascade" }),
    targetType: racketReviewTargetTypeEnum("target_type").notNull(),
    targetId: text("target_id").notNull(),
    decision: racketReviewDecisionEnum("decision").notNull(),
    reason: varchar("reason", { length: 500 }).notNull(),
    reviewedBy: text("reviewed_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    requestId: varchar("request_id", { length: 120 }).notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("racket_review_decisions_product_idx").on(table.productId),
    index("racket_review_decisions_target_idx").on(
      table.targetType,
      table.targetId,
    ),
    index("racket_review_decisions_tenant_team_reviewed_at_idx").on(
      table.tenantId,
      table.teamId,
      table.reviewedAt,
    ),
  ],
);

export const liveSessionCaptures = pgTable(
  "live_session_captures",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 240 }).notNull(),
    normalizedTitle: varchar("normalized_title", { length: 240 }).notNull(),
    sessionLabelKey: varchar("session_label_key", { length: 320 }).notNull(),
    sessionDate: timestamp("session_date", { withTimezone: true }).notNull(),
    platform: sessionPlatformEnum("platform").notNull(),
    status: sessionCaptureStatusEnum("status").notNull().default("draft"),
    summary: text("summary").notNull().default(""),
    sourceMode: sessionSourceModeEnum("source_mode")
      .notNull()
      .default("manual"),
    draftVersion: integer("draft_version").notNull().default(1),
    sensitiveRedactionState:
      customerSensitiveRedactionStateEnum("sensitive_redaction_state")
        .notNull()
        .default("not_needed"),
    lastAutosavedAt: timestamp("last_autosaved_at", { withTimezone: true }),
    submittedBy: text("submitted_by").references(() => appUsers.id, {
      onDelete: "set null",
    }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdBy: text("created_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    updatedBy: text("updated_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("session_captures_scope_label_unique").on(
      table.tenantId,
      table.teamId,
      table.sessionLabelKey,
    ),
    index("session_captures_tenant_team_status_idx").on(
      table.tenantId,
      table.teamId,
      table.status,
    ),
    index("session_captures_tenant_team_date_idx").on(
      table.tenantId,
      table.teamId,
      table.sessionDate,
    ),
    index("session_captures_tenant_team_created_at_idx").on(
      table.tenantId,
      table.teamId,
      table.createdAt,
    ),
  ],
);

export const sessionHostRoles = pgTable(
  "session_host_roles",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    sessionId: text("session_id")
      .notNull()
      .references(() => liveSessionCaptures.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => appUsers.id, {
      onDelete: "set null",
    }),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    role: sessionHostRoleEnum("role").notNull(),
    responsibility: text("responsibility").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("session_host_roles_session_idx").on(table.sessionId),
    index("session_host_roles_tenant_team_role_idx").on(
      table.tenantId,
      table.teamId,
      table.role,
    ),
    index("session_host_roles_user_id_idx").on(table.userId),
  ],
);

export const sessionProductOrder = pgTable(
  "session_product_order",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    sessionId: text("session_id")
      .notNull()
      .references(() => liveSessionCaptures.id, { onDelete: "cascade" }),
    racketProductId: text("racket_product_id").references(
      () => racketProducts.id,
      { onDelete: "set null" },
    ),
    displayModel: varchar("display_model", { length: 180 }).notNull(),
    orderIndex: integer("order_index").notNull(),
    roleInSession: sessionProductRoleEnum("role_in_session").notNull(),
    talkingPoints: jsonb("talking_points")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    customerFit: jsonb("customer_fit")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    evidenceState: sessionEvidenceStateEnum("evidence_state")
      .notNull()
      .default("manual_only"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("session_product_order_session_order_unique").on(
      table.sessionId,
      table.orderIndex,
    ),
    index("session_product_order_session_idx").on(table.sessionId),
    index("session_product_order_racket_idx").on(table.racketProductId),
    index("session_product_order_tenant_team_idx").on(
      table.tenantId,
      table.teamId,
    ),
  ],
);

export const sessionNotes = pgTable(
  "session_notes",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    sessionId: text("session_id")
      .notNull()
      .references(() => liveSessionCaptures.id, { onDelete: "cascade" }),
    noteType: sessionNoteTypeEnum("note_type").notNull(),
    content: text("content").notNull(),
    source: sessionNoteSourceEnum("source").notNull().default("manual"),
    sequence: integer("sequence").notNull(),
    reviewState: sessionReviewStateEnum("review_state")
      .notNull()
      .default("unreviewed"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("session_notes_session_sequence_unique").on(
      table.sessionId,
      table.sequence,
    ),
    index("session_notes_session_idx").on(table.sessionId),
    index("session_notes_tenant_team_type_idx").on(
      table.tenantId,
      table.teamId,
      table.noteType,
    ),
    index("session_notes_tenant_team_review_idx").on(
      table.tenantId,
      table.teamId,
      table.reviewState,
    ),
  ],
);

export const customerQuestions = pgTable(
  "customer_questions",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    sessionId: text("session_id")
      .notNull()
      .references(() => liveSessionCaptures.id, { onDelete: "cascade" }),
    questionText: text("question_text").notNull(),
    topic: customerQuestionTopicEnum("topic").notNull().default("other"),
    relatedProductIds: jsonb("related_product_ids")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    answerGiven: text("answer_given").notNull().default(""),
    needsKnowledge: boolean("needs_knowledge").notNull().default(false),
    sensitiveRedactionState:
      customerSensitiveRedactionStateEnum("sensitive_redaction_state")
        .notNull()
        .default("not_needed"),
    sequence: integer("sequence").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("customer_questions_session_sequence_unique").on(
      table.sessionId,
      table.sequence,
    ),
    index("customer_questions_session_idx").on(table.sessionId),
    index("customer_questions_tenant_team_topic_idx").on(
      table.tenantId,
      table.teamId,
      table.topic,
    ),
    index("customer_questions_tenant_team_needs_knowledge_idx").on(
      table.tenantId,
      table.teamId,
      table.needsKnowledge,
    ),
  ],
);

export const customerObjections = pgTable(
  "customer_objections",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    sessionId: text("session_id")
      .notNull()
      .references(() => liveSessionCaptures.id, { onDelete: "cascade" }),
    objectionType: customerObjectionTypeEnum("objection_type")
      .notNull()
      .default("other"),
    content: text("content").notNull(),
    responseUsed: text("response_used").notNull().default(""),
    resolvedState: customerObjectionResolvedStateEnum("resolved_state")
      .notNull()
      .default("unknown"),
    followUpNeeded: boolean("follow_up_needed").notNull().default(false),
    sequence: integer("sequence").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("customer_objections_session_sequence_unique").on(
      table.sessionId,
      table.sequence,
    ),
    index("customer_objections_session_idx").on(table.sessionId),
    index("customer_objections_tenant_team_type_idx").on(
      table.tenantId,
      table.teamId,
      table.objectionType,
    ),
    index("customer_objections_tenant_team_follow_up_idx").on(
      table.tenantId,
      table.teamId,
      table.followUpNeeded,
    ),
  ],
);

export const knowledgeSources = pgTable(
  "knowledge_sources",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    sourceType: knowledgeSourceTypeEnum("source_type").notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    owner: varchar("owner", { length: 160 }).notNull(),
    url: varchar("url", { length: 2048 }).notNull().default(""),
    normalizedSourceKey: varchar("normalized_source_key", { length: 360 })
      .notNull(),
    retrievedAt: timestamp("retrieved_at", { withTimezone: true }).notNull(),
    trustLevel: knowledgeTrustLevelEnum("trust_level")
      .notNull()
      .default("unknown"),
    reviewState: knowledgeSourceReviewStateEnum("review_state")
      .notNull()
      .default("registered"),
    refreshCadence: knowledgeRefreshCadenceEnum("refresh_cadence")
      .notNull()
      .default("manual"),
    intendedUse: jsonb("intended_use")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    reviewedBy: text("reviewed_by").references(() => appUsers.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdBy: text("created_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    updatedBy: text("updated_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("knowledge_sources_scope_key_unique").on(
      table.tenantId,
      table.teamId,
      table.normalizedSourceKey,
    ),
    index("knowledge_sources_tenant_team_review_idx").on(
      table.tenantId,
      table.teamId,
      table.reviewState,
    ),
    index("knowledge_sources_tenant_team_trust_idx").on(
      table.tenantId,
      table.teamId,
      table.trustLevel,
    ),
    index("knowledge_sources_tenant_team_checked_idx").on(
      table.tenantId,
      table.teamId,
      table.lastCheckedAt,
    ),
  ],
);

export const extractedKnowledgeClaims = pgTable(
  "extracted_knowledge_claims",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    sourceId: text("source_id")
      .notNull()
      .references(() => knowledgeSources.id, { onDelete: "cascade" }),
    claimType: knowledgeClaimTypeEnum("claim_type").notNull(),
    subject: varchar("subject", { length: 240 }).notNull(),
    knowledgeKey: varchar("knowledge_key", { length: 260 }).notNull(),
    claimText: text("claim_text").notNull(),
    language: knowledgeLanguageEnum("language").notNull().default("unknown"),
    confidence: knowledgeConfidenceEnum("confidence")
      .notNull()
      .default("unknown"),
    extractionMethod: knowledgeExtractionMethodEnum("extraction_method")
      .notNull()
      .default("manual"),
    reviewState: knowledgeClaimReviewStateEnum("review_state")
      .notNull()
      .default("pending"),
    reviewedBy: text("reviewed_by").references(() => appUsers.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdBy: text("created_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    updatedBy: text("updated_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("knowledge_claims_source_idx").on(table.sourceId),
    index("knowledge_claims_tenant_team_review_idx").on(
      table.tenantId,
      table.teamId,
      table.reviewState,
    ),
    index("knowledge_claims_tenant_team_key_idx").on(
      table.tenantId,
      table.teamId,
      table.knowledgeKey,
    ),
    index("knowledge_claims_tenant_team_type_idx").on(
      table.tenantId,
      table.teamId,
      table.claimType,
    ),
  ],
);

export const teamKnowledgeNotes = pgTable(
  "team_knowledge_notes",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    noteType: teamKnowledgeNoteTypeEnum("note_type").notNull(),
    knowledgeKey: varchar("knowledge_key", { length: 260 }).notNull(),
    content: text("content").notNull(),
    sensitiveLevel: knowledgeSensitiveLevelEnum("sensitive_level")
      .notNull()
      .default("internal"),
    reviewState: teamKnowledgeReviewStateEnum("review_state")
      .notNull()
      .default("draft"),
    sourceIds: jsonb("source_ids")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    reviewedBy: text("reviewed_by").references(() => appUsers.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdBy: text("created_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    updatedBy: text("updated_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("team_knowledge_notes_tenant_team_review_idx").on(
      table.tenantId,
      table.teamId,
      table.reviewState,
    ),
    index("team_knowledge_notes_tenant_team_key_idx").on(
      table.tenantId,
      table.teamId,
      table.knowledgeKey,
    ),
    index("team_knowledge_notes_tenant_team_type_idx").on(
      table.tenantId,
      table.teamId,
      table.noteType,
    ),
  ],
);

export const knowledgeReviewDecisions = pgTable(
  "knowledge_review_decisions",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    targetType: knowledgeReviewTargetTypeEnum("target_type").notNull(),
    targetId: text("target_id").notNull(),
    decision: knowledgeReviewDecisionEnum("decision").notNull(),
    reason: varchar("reason", { length: 600 }).notNull(),
    reviewedBy: text("reviewed_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    requestId: varchar("request_id", { length: 120 }).notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("knowledge_review_decisions_target_idx").on(
      table.targetType,
      table.targetId,
    ),
    index("knowledge_review_decisions_tenant_team_reviewed_at_idx").on(
      table.tenantId,
      table.teamId,
      table.reviewedAt,
    ),
  ],
);

export const publishedKnowledgeVersions = pgTable(
  "published_knowledge_versions",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    knowledgeKey: varchar("knowledge_key", { length: 260 }).notNull(),
    version: integer("version").notNull(),
    status: publishedKnowledgeStatusEnum("status")
      .notNull()
      .default("published"),
    summary: text("summary").notNull(),
    claimIds: jsonb("claim_ids")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    teamNoteIds: jsonb("team_note_ids")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    sourceIds: jsonb("source_ids")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    publishedBy: text("published_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("published_knowledge_scope_key_version_unique").on(
      table.tenantId,
      table.teamId,
      table.knowledgeKey,
      table.version,
    ),
    index("published_knowledge_tenant_team_status_idx").on(
      table.tenantId,
      table.teamId,
      table.status,
    ),
    index("published_knowledge_tenant_team_key_idx").on(
      table.tenantId,
      table.teamId,
      table.knowledgeKey,
    ),
  ],
);

export const knowledgeConflicts = pgTable(
  "knowledge_conflicts",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    knowledgeKey: varchar("knowledge_key", { length: 260 }).notNull(),
    claimIds: jsonb("claim_ids")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    conflictType: knowledgeConflictTypeEnum("conflict_type").notNull(),
    severity: knowledgeConflictSeverityEnum("severity")
      .notNull()
      .default("medium"),
    resolutionState: knowledgeConflictResolutionStateEnum("resolution_state")
      .notNull()
      .default("open"),
    resolutionDecisionId: text("resolution_decision_id"),
    createdBy: text("created_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    updatedBy: text("updated_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("knowledge_conflicts_tenant_team_state_idx").on(
      table.tenantId,
      table.teamId,
      table.resolutionState,
    ),
    index("knowledge_conflicts_tenant_team_key_idx").on(
      table.tenantId,
      table.teamId,
      table.knowledgeKey,
    ),
    index("knowledge_conflicts_tenant_team_severity_idx").on(
      table.tenantId,
      table.teamId,
      table.severity,
    ),
  ],
);

export const nextSessionTasks = pgTable(
  "next_session_tasks",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 240 }).notNull(),
    summary: text("summary").notNull(),
    taskType: nextSessionTaskTypeEnum("task_type").notNull(),
    priority: nextSessionTaskPriorityEnum("priority")
      .notNull()
      .default("normal"),
    status: nextSessionTaskStatusEnum("status").notNull().default("draft"),
    ownerId: text("owner_id").references(() => appUsers.id, {
      onDelete: "set null",
    }),
    targetSessionId: text("target_session_id"),
    sourceWorkflow:
      nextSessionTaskSourceWorkflowEnum("source_workflow").notNull(),
    deadlinePolicy: nextSessionTaskDeadlinePolicyEnum("deadline_policy")
      .notNull()
      .default("no_due_date"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    reviewRequired: boolean("review_required").notNull().default(false),
    blockedReason: varchar("blocked_reason", { length: 800 })
      .notNull()
      .default(""),
    resultSummary: text("result_summary").notNull().default(""),
    duplicateFingerprint: varchar("duplicate_fingerprint", { length: 360 })
      .notNull(),
    relatedRacketProductIds: jsonb("related_racket_product_ids")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    createdBy: text("created_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    updatedBy: text("updated_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    completedBy: text("completed_by").references(() => appUsers.id, {
      onDelete: "set null",
    }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    closedBy: text("closed_by").references(() => appUsers.id, {
      onDelete: "set null",
    }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("next_tasks_tenant_team_status_idx").on(
      table.tenantId,
      table.teamId,
      table.status,
    ),
    index("next_tasks_tenant_team_owner_idx").on(
      table.tenantId,
      table.teamId,
      table.ownerId,
    ),
    index("next_tasks_tenant_team_due_idx").on(
      table.tenantId,
      table.teamId,
      table.dueAt,
    ),
    index("next_tasks_tenant_team_source_idx").on(
      table.tenantId,
      table.teamId,
      table.sourceWorkflow,
    ),
    index("next_tasks_duplicate_fingerprint_idx").on(
      table.tenantId,
      table.teamId,
      table.duplicateFingerprint,
    ),
  ],
);

export const nextSessionTaskSources = pgTable(
  "next_session_task_sources",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    taskId: text("task_id")
      .notNull()
      .references(() => nextSessionTasks.id, { onDelete: "cascade" }),
    sourceWorkflow:
      nextSessionTaskSourceWorkflowEnum("source_workflow").notNull(),
    sourceId: varchar("source_id", { length: 180 }).notNull(),
    sourceVersionId: varchar("source_version_id", { length: 180 })
      .notNull()
      .default(""),
    sourceSectionId: varchar("source_section_id", { length: 180 })
      .notNull()
      .default(""),
    aiRunId: varchar("ai_run_id", { length: 180 }).notNull().default(""),
    promptVersion: varchar("prompt_version", { length: 180 })
      .notNull()
      .default(""),
    sourceState: nextSessionTaskSourceStateEnum("source_state").notNull(),
    knowledgeVersionIds: jsonb("knowledge_version_ids")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    racketProductIds: jsonb("racket_product_ids")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    talkTrackAssetIds: jsonb("talk_track_asset_ids")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    sensitiveRedactionState:
      nextSessionTaskRedactionStateEnum("sensitive_redaction_state")
        .notNull()
        .default("not_needed"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("next_task_sources_task_idx").on(table.taskId),
    index("next_task_sources_tenant_team_source_idx").on(
      table.tenantId,
      table.teamId,
      table.sourceWorkflow,
      table.sourceId,
    ),
    index("next_task_sources_redaction_idx").on(
      table.tenantId,
      table.teamId,
      table.sensitiveRedactionState,
    ),
  ],
);

export const nextSessionTaskAssignees = pgTable(
  "next_session_task_assignees",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    taskId: text("task_id")
      .notNull()
      .references(() => nextSessionTasks.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    role: nextSessionTaskAssigneeRoleEnum("role").notNull(),
    assignmentState: nextSessionTaskAssignmentStateEnum("assignment_state")
      .notNull()
      .default("active"),
    assignedBy: text("assigned_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("next_task_assignees_task_idx").on(table.taskId),
    index("next_task_assignees_user_idx").on(table.userId),
    index("next_task_assignees_tenant_team_role_idx").on(
      table.tenantId,
      table.teamId,
      table.role,
    ),
  ],
);

export const nextSessionTaskChecklistItems = pgTable(
  "next_session_task_checklist_items",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    taskId: text("task_id")
      .notNull()
      .references(() => nextSessionTasks.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 240 }).notNull(),
    status: nextSessionTaskChecklistStatusEnum("status")
      .notNull()
      .default("todo"),
    position: integer("position").notNull(),
    required: boolean("required").notNull().default(false),
    completedBy: text("completed_by").references(() => appUsers.id, {
      onDelete: "set null",
    }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("next_task_checklist_task_position_unique").on(
      table.taskId,
      table.position,
    ),
    index("next_task_checklist_task_idx").on(table.taskId),
    index("next_task_checklist_tenant_team_status_idx").on(
      table.tenantId,
      table.teamId,
      table.status,
    ),
  ],
);

export const nextSessionTaskDependencies = pgTable(
  "next_session_task_dependencies",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    taskId: text("task_id")
      .notNull()
      .references(() => nextSessionTasks.id, { onDelete: "cascade" }),
    dependsOnType:
      nextSessionTaskDependencyTypeEnum("depends_on_type").notNull(),
    dependsOnId: varchar("depends_on_id", { length: 180 }).notNull(),
    dependencyState: nextSessionTaskDependencyStateEnum("dependency_state")
      .notNull()
      .default("pending"),
    reason: varchar("reason", { length: 600 }).notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    updatedBy: text("updated_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("next_task_dependencies_task_idx").on(table.taskId),
    index("next_task_dependencies_tenant_team_state_idx").on(
      table.tenantId,
      table.teamId,
      table.dependencyState,
    ),
    index("next_task_dependencies_depends_on_idx").on(
      table.dependsOnType,
      table.dependsOnId,
    ),
  ],
);

export const nextSessionTaskReviewResults = pgTable(
  "next_session_task_review_results",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    taskId: text("task_id")
      .notNull()
      .references(() => nextSessionTasks.id, { onDelete: "cascade" }),
    decision: nextSessionTaskReviewDecisionEnum("decision").notNull(),
    reason: varchar("reason", { length: 600 }).notNull(),
    resultSummary: text("result_summary").notNull().default(""),
    reviewedBy: text("reviewed_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("next_task_review_results_task_idx").on(table.taskId),
    index("next_task_review_results_tenant_team_reviewed_idx").on(
      table.tenantId,
      table.teamId,
      table.reviewedAt,
    ),
  ],
);

export const nextSessionTaskFeedbackSignals = pgTable(
  "next_session_task_feedback_signals",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    taskId: text("task_id")
      .notNull()
      .references(() => nextSessionTasks.id, { onDelete: "cascade" }),
    sourceWorkflow:
      nextSessionTaskSourceWorkflowEnum("source_workflow").notNull(),
    signalType: nextSessionTaskFeedbackSignalEnum("signal_type").notNull(),
    reason: varchar("reason", { length: 600 }).notNull(),
    routesTo: nextSessionTaskFeedbackRouteEnum("routes_to")
      .notNull()
      .default("none"),
    actorId: text("actor_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("next_task_feedback_task_idx").on(table.taskId),
    index("next_task_feedback_tenant_team_signal_idx").on(
      table.tenantId,
      table.teamId,
      table.signalType,
    ),
    index("next_task_feedback_tenant_team_route_idx").on(
      table.tenantId,
      table.teamId,
      table.routesTo,
    ),
  ],
);

export const talkTrackAssets = pgTable(
  "talk_track_assets",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    assetType: talkTrackAssetTypeEnum("asset_type").notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    normalizedTitle: varchar("normalized_title", { length: 240 }).notNull(),
    status: talkTrackStatusEnum("status").notNull().default("draft"),
    ownerRole: talkTrackOwnerRoleEnum("owner_role").notNull(),
    currentVersionId: text("current_version_id").notNull().default(""),
    scenarioFingerprint: varchar("scenario_fingerprint", { length: 360 })
      .notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    updatedBy: text("updated_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    archivedBy: text("archived_by").references(() => appUsers.id, {
      onDelete: "set null",
    }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("talk_track_assets_tenant_team_status_idx").on(
      table.tenantId,
      table.teamId,
      table.status,
    ),
    index("talk_track_assets_tenant_team_type_idx").on(
      table.tenantId,
      table.teamId,
      table.assetType,
    ),
    index("talk_track_assets_scenario_fingerprint_idx").on(
      table.tenantId,
      table.teamId,
      table.assetType,
      table.scenarioFingerprint,
    ),
  ],
);

export const talkTrackVersions = pgTable(
  "talk_track_versions",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    assetId: text("asset_id")
      .notNull()
      .references(() => talkTrackAssets.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    status: talkTrackStatusEnum("status").notNull().default("draft"),
    body: text("body").notNull(),
    tone: talkTrackToneEnum("tone").notNull().default("professional"),
    language: talkTrackLanguageEnum("language").notNull().default("zh_CN"),
    reviewDecisionId: text("review_decision_id").notNull().default(""),
    sourceGroundingId: text("source_grounding_id").notNull().default(""),
    candidateId: text("candidate_id").notNull().default(""),
    createdBy: text("created_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    updatedBy: text("updated_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    publishedBy: text("published_by").references(() => appUsers.id, {
      onDelete: "set null",
    }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("talk_track_versions_asset_version_unique").on(
      table.assetId,
      table.version,
    ),
    index("talk_track_versions_asset_idx").on(table.assetId),
    index("talk_track_versions_tenant_team_status_idx").on(
      table.tenantId,
      table.teamId,
      table.status,
    ),
  ],
);

export const talkTrackScenarios = pgTable(
  "talk_track_scenarios",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    assetId: text("asset_id")
      .notNull()
      .references(() => talkTrackAssets.id, { onDelete: "cascade" }),
    racketProductIds: jsonb("racket_product_ids")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    playerLevel: talkTrackPlayerLevelEnum("player_level")
      .notNull()
      .default("unknown"),
    playStyle: talkTrackPlayStyleEnum("play_style")
      .notNull()
      .default("unknown"),
    priceBand: talkTrackPriceBandEnum("price_band")
      .notNull()
      .default("unknown"),
    liveScene: talkTrackLiveSceneEnum("live_scene").notNull(),
    hostRole: talkTrackHostRoleEnum("host_role").notNull().default("host"),
    objectionType: talkTrackObjectionTypeEnum("objection_type"),
    usageConstraints: jsonb("usage_constraints")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    scenarioFingerprint: varchar("scenario_fingerprint", { length: 360 })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("talk_track_scenarios_asset_idx").on(table.assetId),
    index("talk_track_scenarios_fingerprint_idx").on(
      table.tenantId,
      table.teamId,
      table.scenarioFingerprint,
    ),
    index("talk_track_scenarios_scene_idx").on(
      table.tenantId,
      table.teamId,
      table.liveScene,
    ),
  ],
);

export const talkTrackSegments = pgTable(
  "talk_track_segments",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    versionId: text("version_id")
      .notNull()
      .references(() => talkTrackVersions.id, { onDelete: "cascade" }),
    segmentType: talkTrackSegmentTypeEnum("segment_type").notNull(),
    text: text("text").notNull(),
    requiredEvidence: boolean("required_evidence").notNull().default(false),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("talk_track_segments_version_position_unique").on(
      table.versionId,
      table.position,
    ),
    index("talk_track_segments_version_idx").on(table.versionId),
    index("talk_track_segments_tenant_team_type_idx").on(
      table.tenantId,
      table.teamId,
      table.segmentType,
    ),
  ],
);

export const talkTrackObjectionPatterns = pgTable(
  "talk_track_objection_patterns",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    assetId: text("asset_id")
      .notNull()
      .references(() => talkTrackAssets.id, { onDelete: "cascade" }),
    objectionType: talkTrackObjectionTypeEnum("objection_type").notNull(),
    customerQuestionExample: text("customer_question_example")
      .notNull()
      .default(""),
    replyStrategy: talkTrackReplyStrategyEnum("reply_strategy").notNull(),
    riskLevel: talkTrackRiskLevelEnum("risk_level")
      .notNull()
      .default("medium"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("talk_track_objection_patterns_asset_idx").on(table.assetId),
    index("talk_track_objection_patterns_type_idx").on(
      table.tenantId,
      table.teamId,
      table.objectionType,
    ),
  ],
);

export const talkTrackSourceGroundings = pgTable(
  "talk_track_source_groundings",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    assetId: text("asset_id")
      .notNull()
      .references(() => talkTrackAssets.id, { onDelete: "cascade" }),
    versionId: text("version_id")
      .notNull()
      .references(() => talkTrackVersions.id, { onDelete: "cascade" }),
    sourceType: talkTrackSourceTypeEnum("source_type").notNull(),
    sourceIds: jsonb("source_ids")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    knowledgeVersionIds: jsonb("knowledge_version_ids")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    racketProductIds: jsonb("racket_product_ids")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    aiRunId: varchar("ai_run_id", { length: 180 }).notNull().default(""),
    freshnessState: talkTrackFreshnessStateEnum("freshness_state")
      .notNull()
      .default("unknown"),
    conflictState: talkTrackConflictStateEnum("conflict_state")
      .notNull()
      .default("none"),
    sensitiveRedactionState:
      talkTrackSensitiveRedactionStateEnum("sensitive_redaction_state")
        .notNull()
        .default("not_needed"),
    claimSummary: text("claim_summary").notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("talk_track_source_groundings_asset_idx").on(table.assetId),
    index("talk_track_source_groundings_version_idx").on(table.versionId),
    index("talk_track_source_groundings_state_idx").on(
      table.tenantId,
      table.teamId,
      table.freshnessState,
      table.conflictState,
    ),
  ],
);

export const talkTrackReviewDecisions = pgTable(
  "talk_track_review_decisions",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    assetId: text("asset_id")
      .notNull()
      .references(() => talkTrackAssets.id, { onDelete: "cascade" }),
    versionId: text("version_id")
      .notNull()
      .references(() => talkTrackVersions.id, { onDelete: "cascade" }),
    decision: talkTrackReviewDecisionEnum("decision").notNull(),
    reason: varchar("reason", { length: 600 }).notNull(),
    editedBody: text("edited_body").notNull().default(""),
    reviewedBy: text("reviewed_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    requestId: varchar("request_id", { length: 120 }).notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("talk_track_review_decisions_asset_idx").on(table.assetId),
    index("talk_track_review_decisions_version_idx").on(table.versionId),
    index("talk_track_review_decisions_tenant_team_reviewed_at_idx").on(
      table.tenantId,
      table.teamId,
      table.reviewedAt,
    ),
  ],
);

export const talkTrackCandidates = pgTable(
  "talk_track_candidates",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    assetId: text("asset_id"),
    versionId: text("version_id"),
    candidateSource: talkTrackCandidateSourceEnum("candidate_source")
      .notNull(),
    aiRunId: varchar("ai_run_id", { length: 180 }).notNull().default(""),
    aiSectionId: varchar("ai_section_id", { length: 180 })
      .notNull()
      .default(""),
    promptVersion: varchar("prompt_version", { length: 180 })
      .notNull()
      .default(""),
    sourceIds: jsonb("source_ids")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    knowledgeVersionIds: jsonb("knowledge_version_ids")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    racketProductVersionIds: jsonb("racket_product_version_ids")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    scenarioFingerprint: varchar("scenario_fingerprint", { length: 360 })
      .notNull()
      .default(""),
    proposedBody: text("proposed_body").notNull(),
    validationState: talkTrackValidationStateEnum("validation_state")
      .notNull()
      .default("unchecked"),
    reviewState: talkTrackCandidateReviewStateEnum("review_state")
      .notNull()
      .default("pending"),
    sensitiveRedactionState:
      talkTrackSensitiveRedactionStateEnum("sensitive_redaction_state")
        .notNull()
        .default("not_needed"),
    createdBy: text("created_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    updatedBy: text("updated_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("talk_track_candidates_tenant_team_review_idx").on(
      table.tenantId,
      table.teamId,
      table.reviewState,
    ),
    index("talk_track_candidates_asset_idx").on(table.assetId),
    index("talk_track_candidates_ai_run_idx").on(table.aiRunId),
  ],
);

export const talkTrackUsageSignals = pgTable(
  "talk_track_usage_signals",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    assetId: text("asset_id")
      .notNull()
      .references(() => talkTrackAssets.id, { onDelete: "cascade" }),
    versionId: text("version_id")
      .notNull()
      .references(() => talkTrackVersions.id, { onDelete: "cascade" }),
    sourceWorkflow: talkTrackUsageWorkflowEnum("source_workflow").notNull(),
    signalType: talkTrackUsageSignalEnum("signal_type").notNull(),
    reason: varchar("reason", { length: 600 }).notNull(),
    actorId: text("actor_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("talk_track_usage_signals_asset_idx").on(table.assetId),
    index("talk_track_usage_signals_version_idx").on(table.versionId),
    index("talk_track_usage_signals_tenant_team_signal_idx").on(
      table.tenantId,
      table.teamId,
      table.signalType,
    ),
  ],
);

export const aiReviewInputSnapshots = pgTable(
  "ai_review_input_snapshots",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    sessionId: text("session_id").notNull(),
    sessionStatus: sessionCaptureStatusEnum("session_status").notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    sessionDate: timestamp("session_date", { withTimezone: true }).notNull(),
    platform: sessionPlatformEnum("platform").notNull(),
    hostRoles: jsonb("host_roles")
      .$type<Record<string, unknown>[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    productOrder: jsonb("product_order")
      .$type<Record<string, unknown>[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    operatorSummary: text("operator_summary").notNull(),
    questionSummaries: jsonb("question_summaries")
      .$type<Record<string, unknown>[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    objectionSummaries: jsonb("objection_summaries")
      .$type<Record<string, unknown>[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    noteHighlights: jsonb("note_highlights")
      .$type<Record<string, unknown>[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    redactionState: aiReviewRedactionStateEnum("redaction_state")
      .notNull()
      .default("not_needed"),
    longInputPolicy: aiReviewLongInputPolicyEnum("long_input_policy")
      .notNull()
      .default("within_limit"),
    createdBy: text("created_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ai_review_input_snapshots_session_idx").on(table.sessionId),
    index("ai_review_input_snapshots_tenant_team_state_idx").on(
      table.tenantId,
      table.teamId,
      table.redactionState,
      table.longInputPolicy,
    ),
    index("ai_review_input_snapshots_tenant_team_created_idx").on(
      table.tenantId,
      table.teamId,
      table.createdAt,
    ),
  ],
);

export const aiReviewKnowledgeSnapshots = pgTable(
  "ai_review_knowledge_snapshots",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    knowledgeVersionIds: jsonb("knowledge_version_ids")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    racketProductVersionIds: jsonb("racket_product_version_ids")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    sourceIds: jsonb("source_ids")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    trustSummary: jsonb("trust_summary")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(auditMetadataDefault),
    conflictState: aiReviewKnowledgeConflictStateEnum("conflict_state")
      .notNull()
      .default("none"),
    freshnessState: aiReviewKnowledgeFreshnessStateEnum("freshness_state")
      .notNull()
      .default("current"),
    reviewState: aiReviewKnowledgeReviewStateEnum("review_state")
      .notNull()
      .default("published_only"),
    intendedUse: jsonb("intended_use")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    createdBy: text("created_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ai_review_knowledge_snapshots_state_idx").on(
      table.tenantId,
      table.teamId,
      table.conflictState,
      table.freshnessState,
      table.reviewState,
    ),
    index("ai_review_knowledge_snapshots_created_idx").on(
      table.tenantId,
      table.teamId,
      table.createdAt,
    ),
  ],
);

export const aiReviewPromptVersions = pgTable(
  "ai_review_prompt_versions",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 180 }).notNull(),
    version: varchar("version", { length: 80 }).notNull(),
    purpose: aiReviewPromptPurposeEnum("purpose").notNull(),
    inputSchemaVersion: varchar("input_schema_version", { length: 120 })
      .notNull(),
    outputSchemaVersion: varchar("output_schema_version", { length: 120 })
      .notNull(),
    modelPolicy: text("model_policy").notNull(),
    status: aiReviewPromptStatusEnum("status").notNull().default("draft"),
    reviewedBy: text("reviewed_by").references(() => appUsers.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdBy: text("created_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    updatedBy: text("updated_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("ai_review_prompt_versions_scope_unique").on(
      table.tenantId,
      table.teamId,
      table.name,
      table.version,
      table.purpose,
    ),
    index("ai_review_prompt_versions_status_idx").on(
      table.tenantId,
      table.teamId,
      table.status,
    ),
  ],
);

export const aiReviewRuns = pgTable(
  "ai_review_runs",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    sessionId: text("session_id").notNull(),
    status: aiReviewRunStatusEnum("status").notNull().default("draft"),
    runType: aiReviewRunTypeEnum("run_type").notNull(),
    parentRunId: text("parent_run_id").notNull().default(""),
    inputSnapshotId: text("input_snapshot_id")
      .notNull()
      .references(() => aiReviewInputSnapshots.id, { onDelete: "restrict" }),
    knowledgeSnapshotId: text("knowledge_snapshot_id")
      .notNull()
      .references(() => aiReviewKnowledgeSnapshots.id, {
        onDelete: "restrict",
      }),
    promptVersionId: text("prompt_version_id").references(
      () => aiReviewPromptVersions.id,
      { onDelete: "set null" },
    ),
    providerInvocationId: text("provider_invocation_id"),
    requestedSections: jsonb("requested_sections")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    providerPolicy: jsonb("provider_policy")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(auditMetadataDefault),
    createdBy: text("created_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    updatedBy: text("updated_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    archivedBy: text("archived_by").references(() => appUsers.id, {
      onDelete: "set null",
    }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ai_review_runs_tenant_team_status_idx").on(
      table.tenantId,
      table.teamId,
      table.status,
    ),
    index("ai_review_runs_tenant_team_session_idx").on(
      table.tenantId,
      table.teamId,
      table.sessionId,
    ),
    index("ai_review_runs_tenant_team_created_idx").on(
      table.tenantId,
      table.teamId,
      table.createdAt,
    ),
  ],
);

export const aiProviderInvocations = pgTable(
  "ai_provider_invocations",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    runId: text("run_id")
      .notNull()
      .references(() => aiReviewRuns.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 80 }).notNull(),
    providerApi: varchar("provider_api", { length: 120 }).notNull(),
    model: varchar("model", { length: 160 }).notNull(),
    requestId: varchar("request_id", { length: 180 }).notNull(),
    responseId: varchar("response_id", { length: 180 }).notNull().default(""),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    latencyMs: integer("latency_ms").notNull().default(0),
    tokenUsage: jsonb("token_usage")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(auditMetadataDefault),
    finishReason: varchar("finish_reason", { length: 160 })
      .notNull()
      .default(""),
    errorCode: varchar("error_code", { length: 120 }).notNull().default(""),
    redactionState: aiReviewRedactionStateEnum("redaction_state")
      .notNull()
      .default("not_needed"),
    recoverable: boolean("recoverable").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ai_provider_invocations_run_idx").on(table.runId),
    index("ai_provider_invocations_provider_idx").on(
      table.tenantId,
      table.teamId,
      table.provider,
      table.model,
    ),
    index("ai_provider_invocations_error_idx").on(
      table.tenantId,
      table.teamId,
      table.errorCode,
    ),
  ],
);

export const aiReviewOutputs = pgTable(
  "ai_review_outputs",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    runId: text("run_id")
      .notNull()
      .references(() => aiReviewRuns.id, { onDelete: "cascade" }),
    schemaVersion: varchar("schema_version", { length: 120 }).notNull(),
    overallConfidence: aiReviewConfidenceEnum("overall_confidence")
      .notNull()
      .default("unknown"),
    evidenceSummary: jsonb("evidence_summary")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(auditMetadataDefault),
    createdBy: text("created_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ai_review_outputs_run_idx").on(table.runId),
    index("ai_review_outputs_tenant_team_created_idx").on(
      table.tenantId,
      table.teamId,
      table.createdAt,
    ),
  ],
);

export const aiReviewSections = pgTable(
  "ai_review_sections",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    outputId: text("output_id")
      .notNull()
      .references(() => aiReviewOutputs.id, { onDelete: "cascade" }),
    runId: text("run_id")
      .notNull()
      .references(() => aiReviewRuns.id, { onDelete: "cascade" }),
    sectionType: aiReviewSectionTypeEnum("section_type").notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    summary: text("summary").notNull(),
    items: jsonb("items")
      .$type<Record<string, unknown>[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    sourceRefs: jsonb("source_refs")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    confidence: aiReviewConfidenceEnum("confidence")
      .notNull()
      .default("unknown"),
    reviewState: aiReviewSectionReviewStateEnum("review_state")
      .notNull()
      .default("pending"),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("ai_review_sections_output_position_unique").on(
      table.outputId,
      table.position,
    ),
    index("ai_review_sections_run_idx").on(table.runId),
    index("ai_review_sections_tenant_team_review_idx").on(
      table.tenantId,
      table.teamId,
      table.reviewState,
    ),
    index("ai_review_sections_tenant_team_type_idx").on(
      table.tenantId,
      table.teamId,
      table.sectionType,
    ),
  ],
);

export const aiReviewValidationResults = pgTable(
  "ai_review_validation_results",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    runId: text("run_id")
      .notNull()
      .references(() => aiReviewRuns.id, { onDelete: "cascade" }),
    checkType: aiReviewValidationCheckTypeEnum("check_type").notNull(),
    status: aiReviewValidationStatusEnum("status").notNull(),
    message: varchar("message", { length: 800 }).notNull(),
    affectedSectionIds: jsonb("affected_section_ids")
      .$type<string[]>()
      .notNull()
      .default(stringArrayDefault),
    recoverable: boolean("recoverable").notNull().default(false),
    createdBy: text("created_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ai_review_validation_results_run_idx").on(table.runId),
    index("ai_review_validation_results_tenant_team_status_idx").on(
      table.tenantId,
      table.teamId,
      table.status,
    ),
  ],
);

export const aiReviewDecisions = pgTable(
  "ai_review_decisions",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    runId: text("run_id")
      .notNull()
      .references(() => aiReviewRuns.id, { onDelete: "cascade" }),
    targetType: aiReviewDecisionTargetTypeEnum("target_type").notNull(),
    targetId: text("target_id").notNull(),
    decision: aiReviewDecisionEnum("decision").notNull(),
    reason: varchar("reason", { length: 800 }).notNull(),
    editedContent: jsonb("edited_content")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(auditMetadataDefault),
    reviewedBy: text("reviewed_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    requestId: varchar("request_id", { length: 120 }).notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ai_review_decisions_run_idx").on(table.runId),
    index("ai_review_decisions_target_idx").on(table.targetType, table.targetId),
    index("ai_review_decisions_tenant_team_reviewed_idx").on(
      table.tenantId,
      table.teamId,
      table.reviewedAt,
    ),
  ],
);

export const aiReviewFeedbackSignals = pgTable(
  "ai_review_feedback_signals",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    runId: text("run_id")
      .notNull()
      .references(() => aiReviewRuns.id, { onDelete: "cascade" }),
    sectionId: text("section_id").references(() => aiReviewSections.id, {
      onDelete: "set null",
    }),
    signalType: aiReviewFeedbackSignalEnum("signal_type").notNull(),
    reason: varchar("reason", { length: 800 }).notNull(),
    reviewPriority: aiReviewPriorityEnum("review_priority")
      .notNull()
      .default("normal"),
    routesTo: aiReviewFeedbackRouteEnum("routes_to").notNull().default("none"),
    actorId: text("actor_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ai_review_feedback_signals_run_idx").on(table.runId),
    index("ai_review_feedback_signals_section_idx").on(table.sectionId),
    index("ai_review_feedback_signals_tenant_team_route_idx").on(
      table.tenantId,
      table.teamId,
      table.routesTo,
      table.reviewPriority,
    ),
  ],
);

export const aiReviewDownstreamArtifacts = pgTable(
  "ai_review_downstream_artifacts",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    runId: text("run_id")
      .notNull()
      .references(() => aiReviewRuns.id, { onDelete: "cascade" }),
    sectionId: text("section_id")
      .notNull()
      .references(() => aiReviewSections.id, { onDelete: "restrict" }),
    artifactType:
      aiReviewDownstreamArtifactTypeEnum("artifact_type").notNull(),
    status: aiReviewDownstreamArtifactStatusEnum("status")
      .notNull()
      .default("draft"),
    createdBy: text("created_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ai_review_downstream_artifacts_run_idx").on(table.runId),
    index("ai_review_downstream_artifacts_section_idx").on(table.sectionId),
    index("ai_review_downstream_artifacts_tenant_team_type_idx").on(
      table.tenantId,
      table.teamId,
      table.artifactType,
      table.status,
    ),
  ],
);

export type TenantRecord = typeof tenants.$inferSelect;
export type NewTenantRecord = typeof tenants.$inferInsert;
export type TeamRecord = typeof teams.$inferSelect;
export type AppUserRecord = typeof appUsers.$inferSelect;
export type AuthSessionRecord = typeof authSessions.$inferSelect;
export type NewAuthSessionRecord = typeof authSessions.$inferInsert;
export type DataAuditEventRecord = typeof dataAuditEvents.$inferSelect;
export type IdempotencyRecord = typeof idempotencyRecords.$inferSelect;
export type V0TrialFeedbackRecord = typeof v0TrialFeedback.$inferSelect;
export type NewV0TrialFeedbackRecord = typeof v0TrialFeedback.$inferInsert;
export type RacketProductRecord = typeof racketProducts.$inferSelect;
export type NewRacketProductRecord = typeof racketProducts.$inferInsert;
export type RacketProductAliasRecord = typeof racketProductAliases.$inferSelect;
export type NewRacketProductAliasRecord =
  typeof racketProductAliases.$inferInsert;
export type RacketProductSourceRecord =
  typeof racketProductSources.$inferSelect;
export type NewRacketProductSourceRecord =
  typeof racketProductSources.$inferInsert;
export type RacketReviewDecisionRecord =
  typeof racketReviewDecisions.$inferSelect;
export type NewRacketReviewDecisionRecord =
  typeof racketReviewDecisions.$inferInsert;
export type LiveSessionCaptureRecord = typeof liveSessionCaptures.$inferSelect;
export type NewLiveSessionCaptureRecord =
  typeof liveSessionCaptures.$inferInsert;
export type SessionHostRoleRecord = typeof sessionHostRoles.$inferSelect;
export type NewSessionHostRoleRecord = typeof sessionHostRoles.$inferInsert;
export type SessionProductOrderRecord = typeof sessionProductOrder.$inferSelect;
export type NewSessionProductOrderRecord =
  typeof sessionProductOrder.$inferInsert;
export type SessionNoteRecord = typeof sessionNotes.$inferSelect;
export type NewSessionNoteRecord = typeof sessionNotes.$inferInsert;
export type CustomerQuestionRecord = typeof customerQuestions.$inferSelect;
export type NewCustomerQuestionRecord = typeof customerQuestions.$inferInsert;
export type CustomerObjectionRecord = typeof customerObjections.$inferSelect;
export type NewCustomerObjectionRecord = typeof customerObjections.$inferInsert;
export type KnowledgeSourceRecord = typeof knowledgeSources.$inferSelect;
export type NewKnowledgeSourceRecord = typeof knowledgeSources.$inferInsert;
export type ExtractedKnowledgeClaimRecord =
  typeof extractedKnowledgeClaims.$inferSelect;
export type NewExtractedKnowledgeClaimRecord =
  typeof extractedKnowledgeClaims.$inferInsert;
export type TeamKnowledgeNoteRecord = typeof teamKnowledgeNotes.$inferSelect;
export type NewTeamKnowledgeNoteRecord =
  typeof teamKnowledgeNotes.$inferInsert;
export type KnowledgeReviewDecisionRecord =
  typeof knowledgeReviewDecisions.$inferSelect;
export type NewKnowledgeReviewDecisionRecord =
  typeof knowledgeReviewDecisions.$inferInsert;
export type PublishedKnowledgeVersionRecord =
  typeof publishedKnowledgeVersions.$inferSelect;
export type NewPublishedKnowledgeVersionRecord =
  typeof publishedKnowledgeVersions.$inferInsert;
export type KnowledgeConflictRecord = typeof knowledgeConflicts.$inferSelect;
export type NewKnowledgeConflictRecord =
  typeof knowledgeConflicts.$inferInsert;
export type NextSessionTaskRecord = typeof nextSessionTasks.$inferSelect;
export type NewNextSessionTaskRecord = typeof nextSessionTasks.$inferInsert;
export type NextSessionTaskSourceRecord =
  typeof nextSessionTaskSources.$inferSelect;
export type NewNextSessionTaskSourceRecord =
  typeof nextSessionTaskSources.$inferInsert;
export type NextSessionTaskAssigneeRecord =
  typeof nextSessionTaskAssignees.$inferSelect;
export type NewNextSessionTaskAssigneeRecord =
  typeof nextSessionTaskAssignees.$inferInsert;
export type NextSessionTaskChecklistItemRecord =
  typeof nextSessionTaskChecklistItems.$inferSelect;
export type NewNextSessionTaskChecklistItemRecord =
  typeof nextSessionTaskChecklistItems.$inferInsert;
export type NextSessionTaskDependencyRecord =
  typeof nextSessionTaskDependencies.$inferSelect;
export type NewNextSessionTaskDependencyRecord =
  typeof nextSessionTaskDependencies.$inferInsert;
export type NextSessionTaskReviewResultRecord =
  typeof nextSessionTaskReviewResults.$inferSelect;
export type NewNextSessionTaskReviewResultRecord =
  typeof nextSessionTaskReviewResults.$inferInsert;
export type NextSessionTaskFeedbackSignalRecord =
  typeof nextSessionTaskFeedbackSignals.$inferSelect;
export type NewNextSessionTaskFeedbackSignalRecord =
  typeof nextSessionTaskFeedbackSignals.$inferInsert;
export type TalkTrackAssetRecord = typeof talkTrackAssets.$inferSelect;
export type NewTalkTrackAssetRecord = typeof talkTrackAssets.$inferInsert;
export type TalkTrackVersionRecord = typeof talkTrackVersions.$inferSelect;
export type NewTalkTrackVersionRecord = typeof talkTrackVersions.$inferInsert;
export type TalkTrackScenarioRecord = typeof talkTrackScenarios.$inferSelect;
export type NewTalkTrackScenarioRecord =
  typeof talkTrackScenarios.$inferInsert;
export type TalkTrackSegmentRecord = typeof talkTrackSegments.$inferSelect;
export type NewTalkTrackSegmentRecord = typeof talkTrackSegments.$inferInsert;
export type TalkTrackObjectionPatternRecord =
  typeof talkTrackObjectionPatterns.$inferSelect;
export type NewTalkTrackObjectionPatternRecord =
  typeof talkTrackObjectionPatterns.$inferInsert;
export type TalkTrackSourceGroundingRecord =
  typeof talkTrackSourceGroundings.$inferSelect;
export type NewTalkTrackSourceGroundingRecord =
  typeof talkTrackSourceGroundings.$inferInsert;
export type TalkTrackReviewDecisionRecord =
  typeof talkTrackReviewDecisions.$inferSelect;
export type NewTalkTrackReviewDecisionRecord =
  typeof talkTrackReviewDecisions.$inferInsert;
export type TalkTrackCandidateRecord =
  typeof talkTrackCandidates.$inferSelect;
export type NewTalkTrackCandidateRecord =
  typeof talkTrackCandidates.$inferInsert;
export type TalkTrackUsageSignalRecord =
  typeof talkTrackUsageSignals.$inferSelect;
export type NewTalkTrackUsageSignalRecord =
  typeof talkTrackUsageSignals.$inferInsert;
export type AiReviewInputSnapshotRecord =
  typeof aiReviewInputSnapshots.$inferSelect;
export type NewAiReviewInputSnapshotRecord =
  typeof aiReviewInputSnapshots.$inferInsert;
export type AiReviewKnowledgeSnapshotRecord =
  typeof aiReviewKnowledgeSnapshots.$inferSelect;
export type NewAiReviewKnowledgeSnapshotRecord =
  typeof aiReviewKnowledgeSnapshots.$inferInsert;
export type AiReviewPromptVersionRecord =
  typeof aiReviewPromptVersions.$inferSelect;
export type NewAiReviewPromptVersionRecord =
  typeof aiReviewPromptVersions.$inferInsert;
export type AiReviewRunRecord = typeof aiReviewRuns.$inferSelect;
export type NewAiReviewRunRecord = typeof aiReviewRuns.$inferInsert;
export type AiProviderInvocationRecord =
  typeof aiProviderInvocations.$inferSelect;
export type NewAiProviderInvocationRecord =
  typeof aiProviderInvocations.$inferInsert;
export type AiReviewOutputRecord = typeof aiReviewOutputs.$inferSelect;
export type NewAiReviewOutputRecord = typeof aiReviewOutputs.$inferInsert;
export type AiReviewSectionRecord = typeof aiReviewSections.$inferSelect;
export type NewAiReviewSectionRecord = typeof aiReviewSections.$inferInsert;
export type AiReviewValidationResultRecord =
  typeof aiReviewValidationResults.$inferSelect;
export type NewAiReviewValidationResultRecord =
  typeof aiReviewValidationResults.$inferInsert;
export type AiReviewDecisionRecord = typeof aiReviewDecisions.$inferSelect;
export type NewAiReviewDecisionRecord =
  typeof aiReviewDecisions.$inferInsert;
export type AiReviewFeedbackSignalRecord =
  typeof aiReviewFeedbackSignals.$inferSelect;
export type NewAiReviewFeedbackSignalRecord =
  typeof aiReviewFeedbackSignals.$inferInsert;
export type AiReviewDownstreamArtifactRecord =
  typeof aiReviewDownstreamArtifacts.$inferSelect;
export type NewAiReviewDownstreamArtifactRecord =
  typeof aiReviewDownstreamArtifacts.$inferInsert;
