## Why

The cold-start product onboarding path is the first business workflow a merchant uses, but the Chat agent can still describe required product fields inconsistently with the real product form and tool validation. This causes users to follow incorrect guidance before they can collect price history, alerts, or opportunity signals.

## What Changes

- Align Chat guidance with the product form contract: platform, product URL, ASIN/product ID, product title, currency, monitoring toggle, and check interval are visible fields; product URL, ASIN/product ID, and product title must not be described as optional.
- Align the `addProductMonitoring` tool schema with execution behavior by requiring a deterministic product identifier through `asin`.
- Add regression coverage for prompt wording, tool schema requirements, and tool execution validation.
- Add Playwright coverage for the deployed-style cold-start chat answer so the agent does not drift back to optional-field guidance.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `chat-agent-tools`: Tighten `addProductMonitoring` parameter requirements and user-facing descriptions to match product creation validation.
- `chat-agent-backend`: Tighten system prompt behavior for cold-start product onboarding answers.

## Impact

- Backend Chat prompt and agent tool definitions.
- Backend Chat/tool tests.
- Frontend Playwright cold-start onboarding coverage.
- No database migrations, dependencies, or breaking API changes for existing REST clients.
