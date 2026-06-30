## Why

High-effort code review identified 10 critical bugs and architectural issues introduced in recent SSE refactoring and product caching changes. These issues cause memory leaks, connection timeouts, data corruption, and runtime type violations. Without fixes, production stability and user experience will degrade significantly under load.

## What Changes

- **Fix getAllProducts type contract violation** - Include all accessed fields in query projection to prevent undefined property access
- **Restore SSE stream lifecycle management** - Add connection abort detection and 15-second heartbeat to prevent proxy timeouts and memory leaks
- **Add request deduplication** - Prevent double-submission creating duplicate messages and wasting API tokens
- **Fix RAF timer cleanup** - Cancel requestAnimationFrame on component unmount to prevent memory leaks
- **Implement granular cache invalidation** - Replace global cache clearing with key-specific invalidation
- **Remove database index duplication** - Eliminate redundant index creation in app startup code (keep only migrations)
- **Improve tool_use orphan detection** - Make filtering less aggressive for partial streaming results
- **Fix onTextEnd signature consistency** - Align frontend/backend protocol for multi-block text scenarios
- **Add comprehensive test coverage** - Unit tests for all fixes + Playwright E2E tests for SSE streaming and chat reliability
- **Add smoke tests** - Critical path validation for production deployment readiness

## Capabilities

### New Capabilities
- `sse-connection-resilience`: SSE connection lifecycle management with heartbeat, abort detection, and automatic cleanup
- `request-deduplication`: Client-side and server-side guards against duplicate concurrent requests
- `granular-cache-invalidation`: Fine-grained cache invalidation strategy with per-query-key TTL management
- `test-coverage-critical-paths`: Comprehensive test suite covering SSE streaming, product queries, and chat workflows

### Modified Capabilities
- `chat-streaming`: Update SSE protocol to include heartbeat mechanism and connection monitoring (delta: add heartbeat + abort handlers)
- `product-queries`: Fix type contract for partial field selection and add proper cache invalidation (delta: field projection validation + cache strategy)

## Impact

**Backend:**
- `backend/src/routes/chat.ts` - SSE endpoint redesign with lifecycle management
- `backend/src/services/agentTools.ts` - Fix getAllProducts field projection
- `backend/src/services/productService.ts` - Granular cache invalidation
- `backend/src/services/productCache.ts` - Cache strategy overhaul
- `backend/src/db/index.ts` - Remove duplicate index creation
- `backend/src/services/anthropicProvider.ts` - Adjust orphan tool filtering logic

**Frontend:**
- `frontend/src/stores/chatStore.ts` - Fix RAF cleanup
- `frontend/src/hooks/useChatSSE.ts` - Add RAF cancellation in cleanup
- `frontend/src/services/chatApi.ts` - Request deduplication logic

**Testing:**
- New unit tests for cache, SSE lifecycle, deduplication
- New E2E tests with Playwright for chat reliability, long-running streams, double-click prevention
- Smoke test suite for critical paths

**Database:**
- No schema changes, only cleanup of duplicate DDL

**APIs:**
- No breaking changes to external contracts
- Internal SSE protocol enhanced (backward compatible)
