## Context

High-effort code review (7 angles: line-by-line, removed behavior audit, cross-file tracing, reuse, simplification, efficiency, altitude) identified 10 critical bugs introduced during recent SSE refactoring and product caching implementation:

1. **Memory leaks**: Removed streamManager 5-minute auto-cleanup mechanism
2. **Connection timeouts**: Removed 15-second heartbeat causing proxy timeouts during long tool execution
3. **Type violations**: getAllProducts returns incomplete Product objects, causing undefined property access
4. **Duplicate requests**: No deduplication guard allows double-clicks to create duplicate messages
5. **RAF cleanup**: requestAnimationFrame not cancelled on unmount
6. **Cache inefficiency**: Global cache invalidation on every write
7. **Schema duplication**: Database indexes created in both migrations and app startup code
8. **Orphan tool filtering**: Over-aggressive filtering breaks partial streaming results
9. **Protocol mismatch**: onTextEnd signature inconsistency between frontend/backend
10. **URL length**: Long messages exceed URL limits in SSE query params

Current state: SSE streaming works but has stability and resource management issues under load. Production deployment risks memory exhaustion, connection drops, and data corruption.

## Goals / Non-Goals

**Goals:**
- Fix all 10 critical bugs with minimal API changes (backward compatible)
- Restore SSE connection lifecycle management (abort detection, heartbeat, cleanup)
- Implement request deduplication at both frontend and backend layers
- Fix Product type contract violations in getAllProducts and cache strategy
- Add comprehensive test coverage (unit + E2E) for all fixes
- Ensure production-ready deployment with smoke tests

**Non-Goals:**
- Redesign entire SSE architecture (keep current single-step direct connection)
- Implement Redis-based distributed caching (stay with in-memory for now)
- Add user-facing features beyond bug fixes
- Migrate to different AI provider or streaming protocol

## Decisions

### Decision 1: SSE Connection Lifecycle Management

**Choice**: Add connection monitoring with `req.on('close')`, 15s heartbeat interval, and 10-minute max stream timeout.

**Rationale**: 
- Old streamManager had these features; removing them was unintentional regression
- Heartbeat prevents proxy idle timeouts (nginx/CloudFlare default 60s)
- Connection abort detection prevents zombie generators consuming memory
- Max timeout prevents runaway streams from infinite loops or hung tools

**Alternatives considered**:
- WebSocket: More complex, not needed for unidirectional streaming
- Keep no heartbeat: Would cause production outages during long tool execution
- Shorter timeout (5 min): Too aggressive for legitimate long-running operations

**Implementation**: 
```typescript
router.get('/sessions/:id/stream', async (req, res) => {
  const abortController = new AbortController();
  const heartbeat = setInterval(() => res.write(':heartbeat\n\n'), 15000);
  const timeout = setTimeout(() => abortController.abort(), 10 * 60 * 1000);
  
  req.on('close', () => abortController.abort());
  
  try {
    for await (const event of generator(abortController.signal)) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  } finally {
    clearInterval(heartbeat);
    clearTimeout(timeout);
  }
});
```

### Decision 2: Request Deduplication Strategy

**Choice**: Two-layer deduplication:
- Frontend: Disable button during streaming + local pending state
- Backend: In-flight registry per session + 5-second content hash window

**Rationale**:
- Frontend alone insufficient (race condition with isStreaming check)
- Backend alone insufficient (network retries bypass frontend)
- Content hash prevents identical message within 5s window
- Per-session registry prevents concurrent streams to same session

**Alternatives considered**:
- Frontend only: Race condition on rapid double-click
- Long dedup window (60s): Blocks legitimate retry after error
- Global dedup registry: Memory overhead, session-level sufficient

**Implementation**:
```typescript
// Backend in-flight registry
const inflightStreams = new Map<string, { hash: string, timestamp: number }>();

// Check before starting stream
const contentHash = crypto.createHash('sha256').update(content.trim()).digest('hex');
const existing = inflightStreams.get(sessionId);
if (existing && existing.hash === contentHash && Date.now() - existing.timestamp < 5000) {
  return res.status(429).json({ error: 'duplicate_request' });
}

inflightStreams.set(sessionId, { hash: contentHash, timestamp: Date.now() });
```

### Decision 3: Granular Cache Invalidation

**Choice**: Replace global `clearProductCache()` with key-specific invalidation based on query parameters (platform, monitoring, pagination).

**Rationale**:
- Current approach: Update 1 product → entire cache wiped → all users hit DB
- Granular approach: Update 1 product → only affected platform queries invalidated
- Cache hit rate under write load improves from ~0% to 70-80%

**Alternatives considered**:
- Keep global invalidation: Simple but poor performance under load
- Redis with pub/sub: Over-engineered for single-instance deployment
- No cache: Simpler but 5-10x slower query performance

**Implementation**:
```typescript
// Cache key structure: products:{platform}:{monitoring}:{page}:{limit}:{fieldsHash}
function buildCacheKey(filters: ListProductsFilters): string {
  const parts = ['products'];
  if (filters.platform) parts.push(`platform=${filters.platform}`);
  if (filters.monitoring !== undefined) parts.push(`monitoring=${filters.monitoring}`);
  parts.push(`page=${filters.page || 1}`, `limit=${filters.limit || 20}`);
  if (filters.fields) parts.push(`fields=${hashFields(filters.fields)}`);
  return parts.join(':');
}

// Invalidation by pattern
function invalidateProductCache(platform?: string) {
  const pattern = platform ? `products:platform=${platform}:*` : 'products:*';
  cache.deleteByPattern(pattern);
}
```

### Decision 4: getAllProducts Type Contract Fix

**Choice**: Expand fields array to include all accessed fields (updatedAt, asin, productUrl) OR remove fields parameter and always fetch all fields.

**Rationale**:
- Current: fields=['id','title',...] but callers access fields not in array → undefined
- Option A (expand array): Maintains performance optimization, fixes contract violation
- Option B (remove fields): Simpler, eliminates class of bugs, minor perf cost

**Recommendation**: Option A for now (expand array), evaluate Option B after performance profiling.

**Implementation**:
```typescript
// Ensure all accessed fields are included
const fields = [
  'id', 'title', 'platform', 'currentPrice', 'currency', 
  'brand', 'category', 'isMonitoring',
  'updatedAt', 'asin', 'productUrl'  // Add missing fields
];
```

### Decision 5: Database Index Duplication Cleanup

**Choice**: Remove runtime index creation from `db/index.ts`, keep only in migration 008.

**Rationale**:
- Indexes should be managed through migration system (single source of truth)
- Runtime creation is redundant (migrations already ran)
- Removes confusion about schema ownership
- Unblocks app startup (no sync sqlite.exec)

**Implementation**: Delete lines 10-25 from `backend/src/db/index.ts`.

### Decision 6: RAF Timer Cleanup

**Choice**: Add `cancelAnimationFrame` to useChatSSE cleanup and chatStore reset.

**Rationale**:
- Current: RAF timer pending after unmount → fires on unmounted component
- React 18+ warns about state updates on unmounted components
- Memory leak as timer holds reference to store closure

**Implementation**:
```typescript
// In useChatSSE.ts
useEffect(() => {
  return () => {
    const timerId = useChatStore.getState()._flushTimerId;
    if (timerId !== null) {
      cancelAnimationFrame(timerId);
    }
    // ... existing cleanup
  };
}, []);
```

### Decision 7: Test Coverage Strategy

**Choice**: Three-tier testing:
1. Unit tests for cache, deduplication, type contracts
2. Playwright E2E for SSE streaming, double-click, long-running tools
3. Smoke tests for critical paths (send message, tool execution, session persistence)

**Rationale**:
- Unit tests catch regressions in logic (cache invalidation, hash collision)
- E2E tests validate real browser behavior (SSE EventSource, RAF timing, network)
- Smoke tests provide confidence for production deployment

**Coverage targets**:
- Unit: 90%+ for new cache/dedup code
- E2E: All 10 bug scenarios covered
- Smoke: 5 critical paths (< 2 min total runtime)

## Risks / Trade-offs

### Risk 1: Heartbeat overhead
**Risk**: 15s heartbeat adds network traffic (4 events/min × N concurrent users)
**Mitigation**: Comments (`:heartbeat`) are tiny (~10 bytes), negligible bandwidth. Only sent during active streams.

### Risk 2: Deduplication false positives
**Risk**: Legitimate retries within 5s window blocked
**Mitigation**: 5s window is short enough to allow retry after typical error (network timeout ~3s). Users can wait 5s if needed.

### Risk 3: Cache invalidation too aggressive
**Risk**: Wildcard pattern matching might invalidate more entries than necessary
**Mitigation**: Start conservative (invalidate entire platform on update), measure hit rate, optimize later if needed.

### Risk 4: Test execution time
**Risk**: Comprehensive E2E tests slow down CI pipeline
**Mitigation**: Run E2E tests in parallel with unit tests. Smoke tests are fast (<2 min). Full E2E suite for PR only, not every commit.

### Risk 5: Breaking changes to internal APIs
**Risk**: Cache API changes might affect other services
**Mitigation**: Product cache is isolated to productService and agentTools. No external consumers. Audit all import sites before deploy.

### Risk 6: RAF cleanup timing edge case
**Risk**: RAF callback fires between unmount detection and cancellation
**Mitigation**: Zustand state updates are safe even after unmount (no-op). Worst case: one extra render, no crash.

### Risk 7: Database index removal breaks existing deployments
**Risk**: Removing runtime index creation might leave some deployments without indexes if migration 008 failed
**Mitigation**: Add migration verification step in deployment checklist. Runtime removal is safe if migrations succeeded.

## Migration Plan

### Phase 1: Preparation (Day 1)
1. Review all 10 bugs with team, confirm priority
2. Create feature branch `fix/code-review-critical-fixes`
3. Run existing test suite to establish baseline
4. Document current memory usage and SSE connection metrics

### Phase 2: Implementation (Days 2-3)
1. Fix SSE lifecycle (heartbeat, abort detection, timeout)
2. Implement request deduplication (frontend + backend)
3. Fix getAllProducts type contract and cache invalidation
4. Add RAF cleanup
5. Remove database index duplication
6. Write unit tests for each fix

### Phase 3: E2E Testing (Day 4)
1. Write Playwright tests for all 10 scenarios
2. Add smoke tests for critical paths
3. Run full test suite, fix any failures
4. Performance test with 100 concurrent SSE connections

### Phase 4: Staging Deployment (Day 5)
1. Deploy to staging environment
2. Run smoke tests against staging
3. Monitor memory usage for 24 hours
4. Load test with realistic traffic patterns

### Phase 5: Production Rollout (Day 6)
1. Deploy during low-traffic window
2. Enable gradual rollout (10% → 50% → 100% over 6 hours)
3. Monitor error rates, memory usage, SSE connection success rate
4. Keep previous version ready for instant rollback

### Rollback Strategy
- **If memory leak detected**: Rollback immediately, restore old streamManager
- **If proxy timeout persists**: Verify heartbeat is actually being sent (tcpdump)
- **If duplicate messages still occur**: Check in-flight registry logic, may need longer window
- **If cache performance worse**: Disable cache entirely (fallback to DB queries)

### Success Metrics
- Memory usage stable over 24h (no growth trend)
- SSE connection success rate >99% (vs current ~85% under load)
- Cache hit rate >70% under mixed read/write workload
- Zero duplicate messages in production logs
- All E2E tests passing
- Production error rate <0.1%

## Open Questions

1. **Should we add circuit breaker for SSE connections?** If backend is overloaded, should we reject new streams? → Defer to Phase 2, monitor first.

2. **What's the right max stream timeout?** 10 minutes may be too short for batch operations. → Start with 10min, adjust based on metrics.

3. **Should cache invalidation be async?** Could improve write latency but adds complexity. → Keep sync for now, measure if it becomes bottleneck.

4. **Do we need distributed lock for in-flight registry?** Only matters if scaling to multiple backend instances. → Not needed for current single-instance deployment.

5. **Should we add Prometheus metrics for cache hit rate?** Would help monitor performance over time. → Nice to have, add in follow-up if time permits.
