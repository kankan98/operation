## 1. Provider Boundary

- [x] 1.1 Add the server-only AI provider port, normalized error class, metadata types, and redaction helpers.
- [x] 1.2 Add DeepSeek environment parsing with placeholder `.env.example` entries and no committed secrets.
- [x] 1.3 Add the DeepSeek chat-completions adapter with injected fetch, timeout handling, JSON mode request mapping, safe metadata, and failure mapping.

## 2. Verification

- [x] 2.1 Add `ai-provider:check` scripts at the web and root workspace levels.
- [x] 2.2 Add a verifier that first fails without the provider module, then covers fake-fetch success and failure scenarios plus optional live smoke behavior.

## 3. Durable Records

- [x] 3.1 Update AI review run contract, agent architecture, technical roadmap, autonomous roadmap, README files, and accepted specs to record the new provider boundary and remaining non-goals.
- [x] 3.2 Run OpenSpec validation and relevant local checks, then archive the completed change.
