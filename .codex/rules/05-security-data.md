# Security and Data Rules

## Secrets

- Never commit API keys, tokens, cookies, private keys, database URLs, or service credentials.
- Use environment variables and documented secret-management mechanisms.
- Redact secrets from logs, examples, screenshots, prompts, and final responses.
- If a secret appears in the repository or command output, report it and recommend rotation.

## User and Business Data

Treat the following as sensitive unless the user explicitly says otherwise:

- Customer comments, chat logs, private messages, order data, and phone/address data.
- Live commerce transcripts, operational notes, GMV, conversion data, and pricing strategy.
- Product launch plans, inventory, supplier information, and campaign performance.
- Prompt templates, model outputs, and evaluation datasets tied to the business.

## AI Data Handling

- Send only the minimum necessary data to an AI provider.
- Do not include secrets, raw credentials, or unnecessary personal data in prompts.
- Prefer structured input and output schemas for AI analysis.
- Store AI outputs with enough metadata to audit source input, prompt version, model, and time when persistence is required.
- Make it clear when output is AI-generated and requires human judgment.

## Logging and Observability

- Logs MUST avoid raw personal data, secrets, full prompts, and full transcripts unless explicitly required and protected.
- Use request IDs or record IDs instead of sensitive payloads where possible.
- Add retention and deletion considerations when introducing stored user or business data.

## Access Control

- Do not expose cross-tenant or cross-brand data.
- Server-side authorization is required for protected data, even if the UI hides controls.
- Admin or internal tooling must still enforce authentication and least privilege.

## External Integrations

- Verify platform terms, API limits, and official docs before integrating with Douyin, commerce systems, AI providers, storage, or analytics.
- Degrade gracefully when an external provider fails, rate-limits, or returns malformed data.
- Do not scrape or automate platforms in ways that violate terms or create account risk.
