import { useRef, useEffect } from 'react';
import { VariableSizeList as List } from 'react-window';
import { MessageBubble } from './MessageBubble';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolCalls?: Array<{ id?: string; name: string; input?: Record<string, unknown> }>;
  toolResults?: Array<{ toolCallId?: string; output?: unknown; isError?: boolean }>;
}

interface VirtualizedMessageListProps {
  messages: Message[];
  isStreaming: boolean;
  isReconnecting: boolean;
  streamingIndicator: React.ReactNode;
  height: number;
  width: number;
}

/**
 * Virtualized message list for efficient rendering of large conversation histories.
 * Only renders visible messages to maintain 60fps even with 100+ messages.
 */
export function VirtualizedMessageList({
  messages,
  isStreaming,
  isReconnecting,
  streamingIndicator,
  height,
  width,
}: VirtualizedMessageListProps) {
  const listRef = useRef<List>(null);
  const rowHeights = useRef<Record<number, number>>({});

  // Estimate row height based on content length
  const getRowHeight = (index: number) => {
    // Return cached height if available
    if (rowHeights.current[index]) {
      return rowHeights.current[index];
    }

    // Otherwise estimate based on content
    const msg = messages[index];
    if (!msg) return 100;

    // Base height for padding and margins
    let estimatedHeight = 80;

    // Add height for content (rough estimate: 20px per 80 characters)
    const contentLines = Math.ceil(msg.content.length / 80);
    estimatedHeight += contentLines * 20;

    // Add extra height for tool calls
    if (msg.toolCalls && msg.toolCalls.length > 0) {
      estimatedHeight += msg.toolCalls.length * 60;
    }

    // Cache and return
    rowHeights.current[index] = estimatedHeight;
    return estimatedHeight;
  };

  // Update cached height after render
  const setRowHeight = (index: number, size: number) => {
    if (rowHeights.current[index] !== size) {
      rowHeights.current[index] = size;
      listRef.current?.resetAfterIndex(index);
    }
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
    }
  }, [messages.length, isStreaming]);

  // Row renderer
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const rowRef = useRef<HTMLDivElement>(null);
    const msg = messages[index];

    // Measure actual height after render
    useEffect(() => {
      if (rowRef.current) {
        const height = rowRef.current.getBoundingClientRect().height;
        setRowHeight(index, height);
      }
    }, [index, msg]);

    return (
      <div style={style} ref={rowRef} className="px-6 py-3">
        <div className="mx-auto max-w-3xl">
          <MessageBubble
            role={msg.role}
            content={msg.content}
            timestamp={msg.timestamp}
            toolCalls={msg.toolCalls}
            toolResults={msg.toolResults}
          />
        </div>
      </div>
    );
  };

  // Render streaming indicator as last item
  const StreamingRow = ({ style }: { style: React.CSSProperties }) => (
    <div style={style} className="px-6 py-3">
      <div className="mx-auto max-w-3xl">{streamingIndicator}</div>
    </div>
  );

  const itemCount = messages.length + (isStreaming || isReconnecting ? 1 : 0);

  return (
    <List
      ref={listRef}
      height={height}
      width={width}
      itemCount={itemCount}
      itemSize={getRowHeight}
      overscanCount={2}
    >
      {({ index, style }) => {
        // Last item is streaming indicator
        if (index === messages.length) {
          return <StreamingRow style={style} />;
        }
        return <Row index={index} style={style} />;
      }}
    </List>
  );
}
