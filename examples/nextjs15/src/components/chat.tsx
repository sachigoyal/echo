'use client';

import {
  EchoProvider,
  EchoSignIn,
  EchoTokenPurchase,
  useEcho,
  useEchoOpenAI,
} from '@merit-systems/echo-react-sdk';
import { useState } from 'react';

function ChatInterface() {
  const { isAuthenticated } = useEcho();
  const { openai } = useEchoOpenAI({ baseURL: 'http://localhost:3070' });
  const [response, setResponse] = useState('');
  const [input, setInput] = useState('');

  const getMessage = async () => {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: input }],
    });
    setResponse(response.choices[0].message.content || '');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '.5rem',
        height: '50vh',
      }}
    >
      {isAuthenticated ? <EchoTokenPurchase /> : <EchoSignIn />}
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      <button onClick={getMessage}>Send Message</button>
      <p>{response}</p>
    </div>
  );
}

export default function ChatProvider() {
  return (
    <EchoProvider
      config={{
        appId: '4c8a838d-a404-440c-8602-2812b052d9a6',
        // apiUrl: 'https://echo.merit.systems',
        apiUrl: 'http://localhost:3000',
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/chat`,
      }}
    >
      <ChatInterface />
    </EchoProvider>
  );
}
