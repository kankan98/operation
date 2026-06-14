import React, { useState } from 'react';
import { useSSEStream } from '../hooks/useSSEStream';

interface ChatExampleProps {
  sessionId: string;
}

export function ChatExample({ sessionId }: ChatExampleProps) {
  const [input, setInput] = useState('');

  const { messages, isStreaming, error, startStream, stopStream } = useSSEStream(
    sessionId,
    {
      onMessage: (msg) => {
        console.log('Received message:', msg);
      },
      onError: (err) => {
        console.error('Stream error:', err);
      },
      onComplete: () => {
        console.log('Stream completed successfully');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    startStream(input);
    setInput('');
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className="message">
            {msg}
          </div>
        ))}

        {error && (
          <div className="error">
            Error: {error.message}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isStreaming}
        />

        <button type="submit" disabled={isStreaming || !input.trim()}>
          {isStreaming ? 'Sending...' : 'Send'}
        </button>

        {isStreaming && (
          <button type="button" onClick={stopStream}>
            Stop
          </button>
        )}
      </form>
    </div>
  );
}
