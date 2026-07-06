## 1. Anthropic Tool History Conversion

- [x] 1.1 Add failing AnthropicProvider tests for stored assistant toolCalls/toolResults conversion and orphan tool_use filtering.
- [x] 1.2 Implement Anthropic message conversion splitting for database-shaped tool history while preserving final assistant text.
- [x] 1.3 Ensure orphaned historical tool calls are omitted from Anthropic requests with diagnostic warning logs.

## 2. Validation

- [x] 2.1 Run strict OpenSpec validation and targeted provider/chat tests.
- [x] 2.2 Run backend build and diff checks.
- [x] 2.3 Deploy and verify production Chat follow-up tool usage with Playwright.
