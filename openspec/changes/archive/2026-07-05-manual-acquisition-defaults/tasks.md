## 1. Config And Contracts

- [x] 1.1 Add manual-first acquisition feature flags to backend config with safe defaults.
- [x] 1.2 Extend acquisition queue health response schema/types with queue visibility state.
- [x] 1.3 Update OpenAPI examples and shared JS schema artifacts for the new response fields.

## 2. Backend Behavior

- [x] 2.1 Gate `POST /api/scraper/all` so bulk monitoring acquisition returns a disabled no-op response by default.
- [x] 2.2 Preserve explicit single-product manual acquisition behavior.
- [x] 2.3 Include queue operations visibility in queue health responses.

## 3. Tests And Documentation

- [x] 3.1 Update scraper API tests for disabled-by-default and enabled bulk acquisition behavior.
- [x] 3.2 Update acquisition queue schema/service tests for visibility metadata.
- [x] 3.3 Update roadmap/API docs copy to describe manual-first defaults.

## 4. Verification

- [x] 4.1 Run relevant backend scraper/acquisition queue tests.
- [x] 4.2 Run backend build and OpenSpec change validation.
