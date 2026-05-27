## Why

V0 验收包已经能把 AI 复盘质量、来源信任和下游承接识别为阻断项，但 `/ai-review`
当前只展示证据可信度和质量卡点，评估人员还需要自己判断下一步先补知识、核来源、处理校验、
审核区块，还是创建下游草稿。现在应把这些质量信号转成一组可扫读、可执行、仍然人工门控的
修复优先级，让内部 V0 更接近真实试用。

可靠来源和 skill 探索结论：

- NIST AI RMF 1.0 是美国 NIST 发布的 AI 风险管理框架，强调 AI 系统应围绕有效性、可靠性、
  安全、韧性、可解释、隐私和问责等可信特征进行治理；本轮因此不让 AI 建议直接进入权威知识或
  下游发布，而是把风险暴露为人工复核动作。
- NIST AI 600-1 Generative AI Profile 是 NIST 面向生成式 AI 的 AI RMF 配套资料；本轮因此把
  幻觉、证据不足、来源不稳和输出误用作为修复清单的核心风险。
- OWASP Top 10 for LLM Applications 2025 是 OWASP GenAI 项目发布的 LLM 应用风险资料；本轮避免
  过度信任、敏感信息泄露和不当输出处理，继续使用已有安全 run detail 字段，不暴露 prompt、
  provider payload、cookie、数据库 URL 或原始转录。
- W3C/WCAG 2.2 的状态消息和可见焦点要求用于约束动态面板：修复状态必须有文字标签、可访问语义、
  桌面和移动端都能扫读。
- `ui-ux-pro-max` 设计系统查询建议采用扁平、图标辅助、低阴影、状态清晰的 dashboard 模式；本轮只做
  密集操作面板，不引入营销式视觉或复杂 onboarding。
- `roadmap-planning` / `prioritization-advisor` 结论：当前是早期 PMF 前后的内部试用阶段，数据有限，
  应用 Value/Effort 取向优先修 V0 验收阻断和真实操作者信任问题，而不是继续新增孤立接口。

## What Changes

- Add a deterministic AI review remediation plan derived from existing protected run detail, quality triage,
  validation results, feedback signals, review state, confidence, source refs, and downstream eligibility.
- Render a compact `/ai-review` "修复优先级" panel that shows the top repair actions, affected sections,
  downstream blocking state, and the expected next check.
- Keep remediation review-only: no automatic knowledge publishing, source trust changes, prompt edits,
  downstream publishing, task completion, new provider calls, new tables, or RAG.
- Extend focused local verification so `pnpm ai-review:v0-check` proves remediation priority, route labels,
  downstream gating, and redaction using deterministic fake-provider data.
- Update roadmap/contract/spec notes so future production AI evaluation, RAG, feedback queue, or source review UI
  continues from this remediation boundary rather than bypassing it.

## Capabilities

### New Capabilities

- `ai-review-remediation-workflow`: deterministic repair plan and operator-facing remediation guidance for selected AI review runs.

### Modified Capabilities

- `operator-v0-ai-review-workflow`: `/ai-review` shall show remediation priority and action guidance before downstream reuse.
- `ai-review-quality-triage`: quality triage shall expose enough deterministic repair data to drive the remediation plan without live provider calls or mutations.

## Impact

- Affected code: `apps/web/src/lib/ai-review-v0-workflow.ts`,
  `apps/web/src/components/ai-review-workbench.tsx`,
  `apps/web/src/server/ai-review/operator-v0-check.ts`.
- Affected specs/docs: AI review V0 workflow specs, quality triage specs, AI review run contract, autonomous roadmap,
  and continuous development goal.
- APIs and persistence: no new route, no new migration, no new provider, no new dependency.
- Verification: `openspec validate`, focused AI review V0 check, lint, typecheck, build, and Playwright desktop/mobile
  before archive because `/ai-review` rendered UI changes.
