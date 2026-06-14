# Shared Schemas

This directory contains TypeScript types and schemas shared between backend and frontend.

## chat-events.ts

Defines the SSE (Server-Sent Events) event types used for streaming AI agent responses.

### SSEEvent Type

A discriminated union type representing all possible events emitted during a streaming chat session:

```typescript
export type SSEEvent =
  | { type: 'message_start'; message_id: string; timestamp: number }
  | { type: 'status'; status: 'thinking' | 'tool_calling' | 'writing' }
  | { type: 'text_delta'; text: string }
  | { type: 'tool_call_start'; tool_call: { id: string; name: string } }
  | { type: 'tool_call_end'; tool_call: ToolCall }
  | { type: 'tool_result'; tool_result: ToolResult }
  | { type: 'usage'; usage: { input_tokens: number; output_tokens: number } }
  | { type: 'message_done'; message_id: string }
  | { type: 'error'; error: { code: string; message: string } };
```

### Event Types

#### message_start
Emitted when the AI starts generating a new message.

**Fields:**
- `message_id`: Unique identifier for this message
- `timestamp`: Unix timestamp (milliseconds)

**Example:**
```json
{"type": "message_start", "message_id": "msg_abc123", "timestamp": 1704067200000}
```

#### status
Indicates the current phase of AI processing.

**Fields:**
- `status`: One of:
  - `thinking` - AI is reasoning about the response
  - `tool_calling` - AI is executing tools
  - `writing` - AI is writing the final text response

**Example:**
```json
{"type": "status", "status": "thinking"}
```

#### text_delta
Incremental text content as the AI generates the response.

**Fields:**
- `text`: String fragment to append to the message content

**Example:**
```json
{"type": "text_delta", "text": "Let me search"}
```

**Usage:**
Frontend should accumulate these deltas into a complete message:
```typescript
let content = '';
// ... on each text_delta event:
content += event.text;
```

#### tool_call_start
Emitted when the AI begins calling a tool (before parameters are fully streamed).

**Fields:**
- `tool_call.id`: Unique identifier for this tool call
- `tool_call.name`: Name of the tool being called

**Example:**
```json
{"type": "tool_call_start", "tool_call": {"id": "call_1", "name": "searchProducts"}}
```

#### tool_call_end
Emitted when the AI finishes streaming tool call parameters.

**Fields:**
- `tool_call`: Complete ToolCall object with:
  - `id`: Tool call identifier
  - `name`: Tool name
  - `input`: Complete parameters object

**Example:**
```json
{
  "type": "tool_call_end",
  "tool_call": {
    "id": "call_1",
    "name": "searchProducts",
    "input": {"platform": "amazon", "maxPrice": 100}
  }
}
```

#### tool_result
Emitted after a tool has been executed with its result.

**Fields:**
- `tool_result.toolCallId`: ID of the tool call this result corresponds to
- `tool_result.output`: Tool execution result (any JSON-serializable value)
- `tool_result.isError`: Boolean indicating if the tool execution failed

**Example (success):**
```json
{
  "type": "tool_result",
  "tool_result": {
    "toolCallId": "call_1",
    "output": [{"id": "prod_1", "title": "Widget"}],
    "isError": false
  }
}
```

**Example (error):**
```json
{
  "type": "tool_result",
  "tool_result": {
    "toolCallId": "call_2",
    "output": "Database connection failed",
    "isError": true
  }
}
```

#### usage
Token usage statistics for the current message.

**Fields:**
- `usage.input_tokens`: Number of input tokens consumed
- `usage.output_tokens`: Number of output tokens generated

**Example:**
```json
{"type": "usage", "usage": {"input_tokens": 250, "output_tokens": 180}}
```

**Note:** May be emitted multiple times during agent loop iterations; frontend should accumulate totals.

#### message_done
Emitted when the message is complete and streaming has finished.

**Fields:**
- `message_id`: ID of the completed message

**Example:**
```json
{"type": "message_done", "message_id": "msg_abc123"}
```

#### error
Emitted when an error occurs during message generation.

**Fields:**
- `error.code`: Error code (e.g., "rate_limit", "invalid_api_key", "tool_execution_failed")
- `error.message`: Human-readable error description

**Example:**
```json
{"type": "error", "error": {"code": "rate_limit", "message": "API rate limit exceeded"}}
```

### Event Flow

Typical event sequence for a message with one tool call:

```
message_start
  ↓
status (thinking)
  ↓
text_delta (x N) - optional reasoning text
  ↓
status (tool_calling)
  ↓
tool_call_start
  ↓
tool_call_end
  ↓
tool_result
  ↓
status (writing)
  ↓
text_delta (x N) - final response text
  ↓
usage
  ↓
message_done
```

### Agent Loop

For multi-turn tool execution (agent loop), the sequence repeats:

```
message_start
  ↓
[iteration 1]
status (thinking) → tool_call_start → tool_call_end → tool_result
  ↓
[iteration 2]
status (thinking) → tool_call_start → tool_call_end → tool_result
  ↓
[iteration N]
status (writing) → text_delta (x N)
  ↓
usage
  ↓
message_done
```

The backend limits iterations to 5 to prevent infinite loops.

### Frontend Integration

**React example:**

```typescript
import { SSEEvent } from '@/shared/schemas/chat-events';

const handleSSE = (event: SSEEvent) => {
  switch (event.type) {
    case 'message_start':
      // Initialize message UI
      break;
    case 'status':
      setAgentStatus(event.status);
      break;
    case 'text_delta':
      appendToMessage(event.text);
      break;
    case 'tool_call_start':
      createToolCard({ id: event.tool_call.id, status: 'running' });
      break;
    case 'tool_call_end':
      updateToolCard(event.tool_call.id, { params: event.tool_call.input });
      break;
    case 'tool_result':
      updateToolCard(event.tool_result.toolCallId, { 
        result: event.tool_result.output,
        status: event.tool_result.isError ? 'error' : 'success'
      });
      break;
    case 'usage':
      updateTokenCount(event.usage);
      break;
    case 'message_done':
      finalizeMessage();
      break;
    case 'error':
      showError(event.error.message);
      break;
  }
};
```

### Type Safety

The discriminated union provides full TypeScript type narrowing:

```typescript
const handleEvent = (event: SSEEvent) => {
  if (event.type === 'tool_call_end') {
    // TypeScript knows event.tool_call exists here
    console.log(event.tool_call.input);
  }
  
  if (event.type === 'status') {
    // TypeScript knows event.status is 'thinking' | 'tool_calling' | 'writing'
    console.log(event.status);
  }
};
```
