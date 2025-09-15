'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import ThinkingIndicator from './thinking-indicator';

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, error } = useChat();

  const isProcessing = status === 'submitted' || status === 'streaming';
  const isReady = status === 'ready';
  const hasError = status === 'error' || error != null;

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1 pb-4 min-h-0">
        {messages.map(message => (
          <div
            key={message.id}
            className={`rounded-lg border p-3 animate-in fade-in duration-300 ${
              message.role === 'user'
                ? 'bg-blue-50/80 border-blue-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="mb-1 text-xs font-medium text-gray-500">
              {message.role === 'user' ? 'You' : 'Assistant'}
            </div>
            <div className="whitespace-pre-wrap leading-relaxed text-gray-900">
              {message.parts.map((part, i) => {
                switch (part.type) {
                  case 'text':
                    return <div key={`${message.id}-${i}`}>{part.text}</div>;
                }
              })}
            </div>
          </div>
        ))}

        {/* Thinking Indicator */}
        {isProcessing && <ThinkingIndicator />}

        {/* Error Display */}
        {hasError && (
          <div className="rounded-lg border p-3 bg-red-50 border-red-200 animate-in fade-in duration-300">
            <div className="mb-1 text-xs font-medium text-red-600">Error</div>
            <div className="text-sm text-red-700">
              Something went wrong. Please try sending your message again.
            </div>
          </div>
        )}
      </div>

      {/* Input Form - Fixed at bottom */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <form
          onSubmit={e => {
            e.preventDefault();
            if (input.trim() && isReady && !hasError) {
              sendMessage({ text: input });
              setInput('');
            }
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={e => setInput(e.currentTarget.value)}
            placeholder={
              hasError
                ? 'Fix the error above to continue...'
                : 'Type your message...'
            }
            disabled={hasError}
            className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-500 focus:border-2 disabled:bg-gray-50 disabled:text-gray-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || !isReady || hasError}
            className="rounded-md bg-gray-900 px-4 py-2 font-mono text-white shadow-sm transition-all duration-150 hover:bg-gray-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
