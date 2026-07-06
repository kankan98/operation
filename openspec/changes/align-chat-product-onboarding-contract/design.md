## Context

The product form already validates `platform`, `productUrl`, `asin`, `title`, `currency`, `isMonitoring`, and `checkInterval`, with `productUrl`, `asin`, and `title` required for a successful create operation. The Chat agent prompt currently names the fields but only emphasizes ASIN as required, and the `addProductMonitoring` tool schema does not mark `asin` as required even though execution rejects missing identifiers.

This is a narrow contract-alignment change across Chat prompt, tool definition, and tests. It does not add a new workflow or data model.

## Goals / Non-Goals

**Goals:**

- Make Chat cold-start guidance match the real product creation form.
- Make `addProductMonitoring` schema match execution-time validation.
- Prevent future regressions with backend tests and Playwright coverage.

**Non-Goals:**

- No new product fields.
- No change to database schema or product API response shape.
- No automatic product metadata extraction from URLs.
- No new Chat write workflow beyond the existing `addProductMonitoring` tool.

## Decisions

1. Treat the existing product form and backend create schema as the source of truth.
   - Rationale: the user must ultimately pass the UI/API validation; Chat should not define a separate product contract.
   - Alternative considered: relax the product form so only ASIN is required. That would reduce friction but would weaken URL/title-based monitoring and is inconsistent with the current product schema.

2. Require `asin` in the agent tool schema while keeping `productIdentifier` as an alias.
   - Rationale: Anthropic tool schemas support explicit required properties better than prose descriptions. The execution path can still accept `productIdentifier` for older calls, but new model calls should be guided toward `asin`.
   - Alternative considered: require either `asin` or `productIdentifier` with `oneOf`. The current internal tool schema type is simple and existing providers/tests expect a plain required array, so `asin` is the least risky contract.

3. Verify the user-visible answer with Playwright rather than relying only on prompt string tests.
   - Rationale: the original issue was visible in the rendered chat conversation, and prompt changes can still produce drift if the model receives contradictory tool descriptions.

## Risks / Trade-offs

- [Risk] Existing conversations may contain older assistant messages saying fields are optional. -> Mitigation: new messages and tests target only newly generated answers; historical content remains immutable.
- [Risk] Requiring `asin` in the tool schema could make URL-only Amazon additions less likely even though execution can extract ASIN from `/dp/...` URLs. -> Mitigation: this matches the visible form and avoids ambiguous product records; URL extraction remains a fallback, not the primary contract.
- [Risk] The model can still phrase advice imperfectly. -> Mitigation: add precise prompt wording, schema wording, unit tests, and Playwright assertions against optional-field language.
