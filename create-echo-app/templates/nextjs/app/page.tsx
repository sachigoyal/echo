'use client';

import { useChat } from '@ai-sdk/react';

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat();

  return (
    <main className="chat-container">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          🤖 Echo Chat
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          A simple AI chatbot powered by Vercel AI SDK and MERIT SYSTEMS
        </p>
      </div>

      <div className="messages-container">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <p className="text-lg mb-4">👋 Hello! I'm your AI assistant.</p>
            <p>Ask me anything to get started!</p>
          </div>
        )}

        {messages.map(message => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="font-semibold mb-1">
              {message.role === 'user' ? '👤 You' : '🤖 Assistant'}
            </div>
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        ))}

        {isLoading && (
          <div className="message assistant">
            <div className="font-semibold mb-1">🤖 Assistant</div>
            <div className="flex items-center space-x-1">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></div>
              </div>
              <span className="text-gray-500 ml-2">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="input-container">
        <input
          value={input}
          placeholder="Type your message here..."
          onChange={handleInputChange}
          className="message-input"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="send-button"
        >
          {isLoading ? '⏳' : '📤'} Send
        </button>
      </form>
    </main>
  );
}
