## Why

Users experience poor scrolling behavior in the chat interface. The "scroll to bottom" button is positioned incorrectly (right-aligned instead of center), and messages don't auto-scroll during streaming, forcing manual scrolling to follow AI responses. These UX issues create friction in the core chat experience and detract from the "Calm Intelligence" design principle.

## What Changes

- Reposition scroll-to-bottom button from right-aligned to center-aligned
- Implement auto-scroll behavior that follows streaming message output
- Add intelligent scroll interruption detection (don't auto-scroll when user is actively viewing history)
- Enhance new message badge visibility logic based on scroll position and user intent
- Add mobile keyboard adaptation for scroll behavior
- Improve scroll performance with optimized scroll event handling

## Capabilities

### New Capabilities
- `intelligent-auto-scroll`: Smart auto-scrolling that follows streaming output while respecting user intent to view history
- `scroll-button-ux`: Enhanced scroll-to-bottom button with center positioning and improved badge indicators

### Modified Capabilities
<!-- No existing capabilities are being modified at the spec level -->

## Impact

**Frontend Components:**
- `frontend/src/hooks/useScrollControl.ts` - Enhanced with user intent detection
- `frontend/src/components/chat/ScrollButton.tsx` - Repositioned and enhanced styling
- `frontend/src/pages/Chat.tsx` - Auto-scroll integration with message streaming
- `frontend/src/components/chat/MessageList.tsx` - Scroll behavior coordination

**Design System:**
- Follows `docs/style.md` Agent Purple theme and motion system (150-250ms ease-out)
- Mobile touch targets meet 44px minimum accessibility requirement

**No breaking changes** - Pure UX enhancement with no API or data structure modifications
