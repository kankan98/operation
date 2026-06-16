## Context

The chat interface currently has suboptimal scrolling UX:
1. Scroll-to-bottom button is right-aligned (inconsistent with center-focused chat design)
2. No auto-scroll during streaming (users must manually scroll to follow AI responses)
3. No intelligent behavior to respect user intent when viewing history

The existing `useScrollControl` hook provides basic scroll detection (distance from bottom), and `ScrollButton` component handles the button rendering. We need to enhance both to provide a polished, context-aware scrolling experience.

**Current Implementation:**
- `useScrollControl`: Tracks `scrollRef`, `showScrollButton`, `hasNewMessage`, provides `scrollToBottom()` and `handleScroll()`
- `ScrollButton`: Renders at `fixed bottom-24 right-6`
- `MessageList`: Has scroll container with `onScroll` handler
- No connection between streaming state and scroll behavior

**Design System Constraints (docs/style.md):**
- Motion: 150-250ms duration, ease-out easing
- Agent Purple theme (Primary-600: #7C3AED)
- Button radius: 12px
- Touch targets: ≥44px
- "Calm Intelligence" principle: guide, don't interrupt

## Goals / Non-Goals

**Goals:**
- Center-align scroll button for visual balance
- Auto-scroll smoothly during streaming output
- Detect user intent to view history and pause auto-scroll
- Show clear indication when new messages arrive while scrolled up
- Adapt to mobile keyboard without blocking input
- Maintain 60fps scroll performance

**Non-Goals:**
- Scroll position persistence across sessions (future feature)
- Custom scroll animations beyond browser smooth scrolling
- Scroll-to-specific-message functionality
- Horizontal scrolling for wide content

## Decisions

### Decision 1: User Intent Detection Strategy
**Choice:** Distance-based heuristic with hysteresis

**Rationale:**
- Simple and predictable: user scrolled >200px = intentional history viewing
- Hysteresis (200px to disable, 120px to re-enable) prevents scroll flapping near threshold
- Avoids complex gesture detection or timing heuristics

**Alternatives Considered:**
- **Time-based**: Track scroll velocity and duration → Too complex, hard to tune
- **Manual toggle**: User explicitly disables auto-scroll → Extra UI clutter, more cognitive load
- **Single threshold**: Use same value for enable/disable → Causes flickering when hovering near threshold

**Implementation:** Add `userScrolledUp` state to `useScrollControl` hook, set when distance > 200px

---

### Decision 2: Auto-Scroll Trigger Mechanism
**Choice:** useEffect watching `messages` array and `isStreaming` flag

**Rationale:**
- React's reactive paradigm: scroll on data change, not imperative calls
- Clean separation: hook manages scroll logic, components stay simple
- Handles both initial message arrival and streaming deltas

**Alternatives Considered:**
- **SSE event callback**: Trigger scroll in `onTextDelta` handler → Couples SSE logic to scroll logic
- **Ref-based imperative**: Call `scrollToBottom()` from parent → Fragile, easy to miss edge cases

**Implementation:**
```tsx
useEffect(() => {
  if (isStreaming && !userScrolledUp && nearBottomRef.current) {
    scrollToBottom();
  }
}, [messages, isStreaming]);
```

---

### Decision 3: Scroll Button Positioning Approach
**Choice:** CSS `left: 50%; transform: translateX(-50%)` centering

**Rationale:**
- Works across all viewport sizes without JS
- No layout shift when button appears/disappears
- Standard CSS pattern, compatible with animations

**Alternatives Considered:**
- **Flexbox centering on parent**: Requires changing parent layout → Too invasive
- **Absolute + calc()**: `left: calc(50% - buttonWidth/2)` → Less flexible for button size changes

**Implementation:** Update `ScrollButton` className to use `left-1/2 -translate-x-1/2`

---

### Decision 4: Performance Optimization Strategy
**Choice:** requestAnimationFrame throttling for scroll handler

**Rationale:**
- Scroll events fire rapidly (100+ times/sec on some devices)
- RAF ensures calculations run at most once per frame (60fps)
- Prevents layout thrashing and excessive state updates

**Already implemented** in current `useScrollControl` via `scrollRafRef`, no changes needed.

---

### Decision 5: Mobile Keyboard Detection
**Choice:** VisualViewport API with fallback

**Rationale:**
- `visualViewport.height` reliably detects keyboard on iOS/Android
- Resize event triggers when keyboard shows/hides
- Graceful degradation: no-op on desktop, no errors

**Alternatives Considered:**
- **Focus event heuristic**: Assume keyboard on input focus → False positives on Bluetooth keyboards
- **Height change detection**: Compare `window.innerHeight` → Unreliable on iOS Safari

**Implementation:** Add optional `visualViewport` listener in `useScrollControl`, adjust scroll offset when viewport shrinks

---

### Decision 6: New Message Badge Timing
**Choice:** Set badge when new content arrives AND user is >200px from bottom

**Rationale:**
- Aligns with user intent detection threshold (consistent logic)
- Only show badge when user would NOT see the new message
- Clear on scroll-to-bottom or when scrolling within 120px (hysteresis)

**Implementation:** Enhance `hasNewMessage` state logic in `useScrollControl`

## Risks / Trade-offs

### Risk: Auto-scroll during rapid typing
**Scenario:** User sends message, immediately types another, viewport scrolls away from input

**Mitigation:** 
- Only auto-scroll if `nearBottomRef.current` is true (user was already near bottom)
- Input field is fixed at bottom, never scrolls out of view

---

### Risk: Scroll flapping near 200px threshold
**Scenario:** User scrolls to ~195px, viewport bounces between auto-scroll on/off

**Mitigation:**
- Hysteresis: disable at >200px, re-enable at <120px (80px dead zone)
- Smooth scroll animation takes time, reducing sensitivity to small scroll jitter

---

### Risk: Mobile viewport height changes affect scroll position
**Scenario:** Keyboard appears, viewport shrinks, messages shift unexpectedly

**Mitigation:**
- Detect viewport resize via VisualViewport API
- Maintain scroll position relative to bottom (not top) when keyboard appears
- Auto-scroll resumes only after keyboard dismissal

---

### Trade-off: No scroll position memory across refreshes
**Decision:** Out of scope for this change

**Rationale:**
- Requires session storage + scroll restoration logic
- Increases complexity significantly
- User expectation in chat: start at latest message

---

### Trade-off: No support for scroll-to-message anchors
**Decision:** Out of scope (future feature)

**Rationale:**
- Requires message anchor IDs and URL state management
- Not critical for MVP scrolling experience
- Can be added later without breaking changes

## Open Questions

None - all technical decisions resolved.
