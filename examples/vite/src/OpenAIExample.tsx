import { useState } from 'react';
// Import the new standalone hook from the package to ensure proper context sharing
import { useEchoOpenAI } from '@merit-systems/echo-react-sdk';

export function OpenAIExample() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Use the standalone hook - no provider needed!
  const { openai, isReady, error, isLoading } = useEchoOpenAI({
    baseURL: 'https://echo.router.merit.systems', // Optional, has default
    // baseURL: 'http://localhost:3070',
    enabled: true, // Optional, defaults to true
  });

  const handleSendMessage = async () => {
    if (!openai || !input.trim() || isGenerating) return;

    setIsGenerating(true);
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, `You: ${userMessage}`]);

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: userMessage }],
        max_tokens: 150,
      });

      const response = completion.choices[0]?.message?.content || 'No response';
      setMessages(prev => [...prev, `AI: ${response}`]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setMessages(prev => [...prev, `Error: ${errorMessage}`]);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading OpenAI client...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: 'red' }}>Error: {error}</p>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>OpenAI client not ready. Please ensure you're authenticated.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>OpenAI Chat Example</h2>

      <div
        style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '10px',
          minHeight: '200px',
          marginBottom: '10px',
          backgroundColor: '#f9f9f9',
        }}
      >
        {messages.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            Start a conversation...
          </p>
        ) : (
          messages.map((message, index) => (
            <div key={index} style={{ marginBottom: '8px' }}>
              {message}
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type your message..."
          style={{
            flex: 1,
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '5px',
          }}
          disabled={isGenerating}
        />
        <button
          onClick={handleSendMessage}
          disabled={!input.trim() || isGenerating}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007cba',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            opacity: isGenerating ? 0.6 : 1,
          }}
        >
          {isGenerating ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
