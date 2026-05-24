## Context

The project has reached the first AI review stage where local run persistence
exists but real provider execution is still missing. The user has selected
DeepSeek, with base URL `https://api.deepseek.com` and model
`deepseek-v4-pro`. The repository rules require a provider OpenSpec gate before
runtime AI calls, secret handling through environment variables, structured
output validation, and failure mapping.

This is stage 5 work from
`docs/architecture/technical-implementation-roadmap.md`. It introduces an AI
boundary but does not connect browser workflows, RAG, queues, or production
release behavior.

## Goals / Non-Goals

**Goals:**

- Define a server-only `AiProviderPort` that business code can depend on
  without knowing DeepSeek request/response shapes.
- Implement a DeepSeek adapter using native `fetch`, no SDK dependency, and
  explicit timeout handling.
- Parse DeepSeek configuration from environment variables without committing or
  logging credentials.
- Normalize provider success metadata and failures into app-owned codes with
  retryability and safe messages.
- Validate structured JSON output with Zod before it is returned to callers.
- Add a verifier that covers fake-provider success and failure scenarios without
  requiring a real API key.

**Non-Goals:**

- No prompt orchestration for full AI review.
- No RAG, retrieval snapshots, embeddings, or web discovery.
- No database migration and no writes to the AI review run ledger from this
  adapter.
- No public API, Route Handler, Server Action, UI save flow, or Playwright
  verification.
- No provider SDK, queue, streaming, tool calling, function calling, or
  autonomous actions.
- No use of the chat-provided API key in files or command logs.

## Decisions

### 1. Use an app-owned port instead of provider SDK objects

The implementation will add `apps/web/src/server/ai-provider/port.ts` with
types for messages, JSON generation input, provider metadata, and normalized
errors. Callers get `content`, parsed JSON, and metadata; they never receive
provider-native objects, headers, request bodies, or raw error payloads.

Alternatives considered:

- Direct DeepSeek calls from future AI review service: rejected because it would
  bind domain code to one provider and violate the architecture boundary.
- Vercel AI SDK or another orchestration library: deferred because this slice
  only needs a single JSON chat completion call, and adding a dependency would
  increase maintenance and provider lock-in before streaming/tooling is needed.

### 2. Implement DeepSeek with native fetch and dependency injection

`deepseek.ts` will expose a factory such as `createDeepSeekProvider(config,
fetchImpl)` where `fetchImpl` defaults to global `fetch`. This keeps production
code simple and makes verifier scenarios deterministic.

The adapter will call:

```text
POST {baseUrl}/chat/completions
Authorization: Bearer <env key>
Content-Type: application/json
```

The request will set `model`, `messages`, `temperature`, `max_tokens`, and
`response_format: { "type": "json_object" }` when structured JSON is required.

### 3. Treat JSON mode as a helper, not a guarantee

DeepSeek's JSON output mode requires the prompt to instruct the model to output
JSON, and the provider can still return empty, truncated, malformed, or schema
mismatched content. The adapter will:

- require at least one message;
- optionally enforce that callers declare JSON intent;
- parse content with `JSON.parse`;
- validate parsed output with the caller's Zod schema;
- convert `finish_reason="length"` into `PARTIAL_MODEL_OUTPUT`;
- convert empty content to `AI_PROVIDER_EMPTY_OUTPUT`;
- convert malformed JSON to `AI_PROVIDER_MALFORMED_JSON`;
- convert schema errors to `AI_PROVIDER_SCHEMA_MISMATCH`.

### 4. Normalize failures and keep errors safe

Provider and local failures will map to app-owned codes:

- missing key/config: `AI_PROVIDER_CONFIG_MISSING`;
- invalid request / 400 / 422: `AI_PROVIDER_INVALID_REQUEST`;
- auth failure / 401: `AI_PROVIDER_AUTH_FAILED`;
- rate limit / 429: `AI_PROVIDER_RATE_LIMITED`;
- timeout: `AI_PROVIDER_TIMEOUT`;
- provider unavailable / 500 / 503 / network failure:
  `AI_PROVIDER_UNAVAILABLE`;
- refusal or content filtering signals: `AI_PROVIDER_REFUSAL`;
- partial output: `PARTIAL_MODEL_OUTPUT`;
- malformed JSON: `AI_PROVIDER_MALFORMED_JSON`;
- schema mismatch: `AI_PROVIDER_SCHEMA_MISMATCH`.

Errors may include status, retryability, request ID, and issue summaries, but
must not include API keys, Authorization headers, full prompts, full provider
request/response bodies, transcripts, customer personal data, or raw business
payloads.

### 5. Keep live provider calls optional

`pnpm ai-provider:check` must pass with fake fetch and no API key. If
`DEEPSEEK_API_KEY` is present and `DEEPSEEK_LIVE_SMOKE=1`, the verifier may make
a tiny JSON request to confirm runtime configuration. This avoids accidental
quota spend and avoids putting the user's chat-provided key in shell history.

## Risks / Trade-offs

- Provider model or API behavior may differ from documentation -> normalize
  only stable request/response fields and keep provider-native payloads outside
  domain code.
- The user-provided model name may not be available for the current account ->
  live smoke is optional and returns a safe provider error without blocking fake
  verification.
- JSON mode can still return invalid output -> Zod validation remains a
  required boundary before any caller can use model output.
- A future full AI review service may need streaming or retries -> this slice
  records timeout/error metadata but defers retry policy and async queues to the
  AI review MVP OpenSpec.
- Real business input could leak if callers pass raw transcripts -> current
  adapter does not construct prompts; future AI review service must continue
  using redacted snapshots and minimum necessary fields.

## Migration Plan

1. Add the server-only provider module, environment parser, DeepSeek adapter,
   and verifier.
2. Add root/web scripts for `ai-provider:check`.
3. Update `.env.example` with placeholder environment variables only.
4. Update contract, roadmap, README, and specs to reflect the new local runtime
   boundary.
5. Verify with OpenSpec, provider check, lint, typecheck, and build.

Rollback path: remove `apps/web/src/server/ai-provider/*`, remove the package
scripts and placeholder env entries, and revert the docs/spec updates. No
database migration or persisted data is introduced.
