## Why

The Chat page currently shows only a demo UI with hardcoded responses. To deliver the core value proposition of an AI-powered e-commerce operations assistant, we need to implement a fully functional chat interface backed by Claude API with tool-use capabilities. This enables users to interact naturally with their product data, get insights, and automate monitoring tasks through conversation.

## What Changes

- Implement backend Chat API with Claude SDK integration (tool use + streaming)
- Create AI Agent service with 10 predefined tools for product/alert operations
- Build conversation session management (persistence, context, history)
- Upgrade frontend Chat page from demo to production-ready with real API integration
- Add streaming message display with markdown rendering and tool call visualization
- Implement conversation history sidebar with session management
- Design calm, minimal chat UI following the established design system (style.md)
- Add system prompt engineering for e-commerce domain expertise
- **BREAKING**: Replace mock chat responses with real Claude API calls (requires ANTHROPIC_API_KEY)

## Capabilities

### New Capabilities

- `chat-agent-backend`: Claude API integration with tool use, session management, and conversation persistence
- `chat-agent-tools`: Tool definitions for searchProducts, getProductDetails, analyzePriceTrend, createAlert, etc.
- `chat-ui-production`: Production-grade chat interface with streaming, markdown, session history, and responsive design
- `conversation-management`: Session CRUD, message history, context summarization

### Modified Capabilities

<!-- No existing capabilities require requirement changes -->

## Impact

**Backend**:
- New `/backend/src/services/chatService.ts` - Claude API integration
- New `/backend/src/services/agentTools.ts` - Tool definitions and execution
- New `/backend/src/routes/chat.ts` - Chat API endpoints
- Database schema extensions: `chat_sessions` and `chat_messages` tables already defined
- New environment variable: `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (default: claude-opus-4-8)
- New dependency: `@anthropic-ai/sdk`

**Frontend**:
- Major refactor of `/frontend/src/pages/Chat.tsx` - from demo to production
- New `/frontend/src/components/chat/MessageBubble.tsx` - markdown + tool visualization
- New `/frontend/src/components/chat/SessionSidebar.tsx` - conversation history
- New `/frontend/src/components/chat/StreamingIndicator.tsx` - typing animation
- New `/frontend/src/services/chatApi.ts` - API client with streaming support
- New Zustand store: `/frontend/src/stores/chatStore.ts` - session state management

**Dependencies**:
- Backend: Add `@anthropic-ai/sdk` (~200KB)
- Frontend: Add `react-markdown` and `remark-gfm` for markdown rendering (~150KB)

**Design System Alignment**:
- All UI components follow `docs/style.md` principles: calm, minimal, high information density
- Uses existing Tailwind CSS v4 design tokens
- Adheres to 8pt rhythm, soft corners, subtle elevation
- Typography and color system consistent with Dashboard
