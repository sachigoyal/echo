# Echo React SDK Documentation

The Echo React SDK (`@zdql/echo-react-sdk`) provides a complete React integration for building applications with OAuth2 authentication, token management, and AI chat capabilities.

## Installation

```bash
npm install @zdql/echo-react-sdk
# or
yarn add @zdql/echo-react-sdk
```

## Basic Setup

### 1. Configure the EchoProvider

Wrap your application with the `EchoProvider` to enable SDK functionality:

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { EchoProvider } from '@zdql/echo-react-sdk';
import App from './App';

const echoConfig = {
  instanceId: 'your-instance-id-here', // Replace with your actual app ID
  apiUrl: 'https://echo.merit.systems', // Replace with your API URL
  redirectUri: window.location.origin + '/callback',
};

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <EchoProvider config={echoConfig}>
    <App />
  </EchoProvider>
);
```

### 2. Configuration Options

| Option        | Type   | Required | Description                                              |
| ------------- | ------ | -------- | -------------------------------------------------------- |
| `instanceId`  | string | ✅       | Your unique Echo instance identifier                     |
| `apiUrl`      | string | ✅       | The Echo API base URL                                    |
| `redirectUri` | string | ✅       | OAuth callback URL (must match your registered callback) |

## Authentication

### useEcho Hook

The `useEcho` hook provides access to authentication state and user data:

```tsx
import { useEcho } from '@zdql/echo-react-sdk';

const MyComponent = () => {
  const { isAuthenticated, isLoading, user, error, token, signOut } = useEcho();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please sign in</div>;

  return (
    <div>
      <h1>Welcome, {user.name || user.email}!</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
};
```

### EchoSignIn Component

Use the `EchoSignIn` component for OAuth authentication:

```tsx
import { EchoSignIn } from '@zdql/echo-react-sdk';

const AuthenticationPanel = () => {
  const handleSignInSuccess = user => {
    console.log('Sign in successful:', user);
  };

  const handleSignInError = error => {
    console.error('Sign in failed:', error);
  };

  return (
    <EchoSignIn
      onSuccess={handleSignInSuccess}
      onError={handleSignInError}
      className="custom-sign-in-button"
    >
      Sign In with Echo
    </EchoSignIn>
  );
};
```

### OAuth Callback Handler

Create a callback route to handle OAuth redirects:

```tsx
import { useEcho } from '@zdql/echo-react-sdk';
import { useNavigate } from 'react-router-dom';

const CallbackHandler = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, error } = useEcho();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect to dashboard after successful authentication
      navigate('/dashboard');
    } else if (error) {
      // Handle authentication error
      console.error('Auth error:', error);
      navigate('/');
    }
  }, [isAuthenticated, user, error, navigate]);

  return <div>Processing authentication...</div>;
};
```

## Token Balance Management

### Displaying User Balance

```tsx
import { useEcho } from '@zdql/echo-react-sdk';

const BalanceDisplay = () => {
  const { balance, refreshBalance, isLoading, error } = useEcho();

  if (isLoading) return <div>Loading balance...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h3>Your Balance</h3>
      <div>
        <span>{balance?.credits || 0}</span>
        <span>{balance?.currency || 'credits'}</span>
      </div>
      <button onClick={refreshBalance}>Refresh</button>
    </div>
  );
};
```

## Token Purchase

### EchoTokenPurchase Component

Enable in-app token purchases:

```tsx
import { EchoTokenPurchase, useEcho } from '@zdql/echo-react-sdk';

const TokenPurchase = () => {
  const { refreshBalance, createPaymentLink } = useEcho();
  const [amount, setAmount] = useState(100);

  const handlePurchaseComplete = newBalance => {
    console.log('Purchase completed! New balance:', newBalance);
    refreshBalance(); // Update balance display
  };

  const handlePurchaseError = error => {
    console.error('Purchase failed:', error);
  };

  const handleCreatePaymentLink = async () => {
    try {
      const paymentLink = await createPaymentLink(amount);
      window.open(paymentLink, '_blank');
    } catch (error) {
      console.error('Failed to create payment link:', error);
    }
  };

  return (
    <div>
      <h3>Purchase Tokens</h3>
      <input
        type="number"
        value={amount}
        onChange={e => setAmount(Number(e.target.value))}
        min="1"
      />

      <EchoTokenPurchase
        amount={amount}
        onPurchaseComplete={handlePurchaseComplete}
        onError={handlePurchaseError}
      >
        Purchase {amount} Tokens
      </EchoTokenPurchase>

      <button onClick={handleCreatePaymentLink}>Create Payment Link</button>
    </div>
  );
};
```

## AI Chat Integration

### Setting Up Chat with LLM

Use the authenticated token to make API calls to your chat endpoint:

```tsx
import { useEcho } from '@zdql/echo-react-sdk';

const ChatInterface = () => {
  const { token } = useEcho();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async e => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'x-echo-token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      const data = await response.json();

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.text || 'No response',
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  return (
    <div>
      <div className="messages">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.role}`}>
            {message.content}
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};
```

## Complete Application Structure

### App Component with Routing

```tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEcho } from '@zdql/echo-react-sdk';
import AuthenticationPanel from './components/AuthenticationPanel';
import Dashboard from './components/Dashboard';
import CallbackHandler from './components/CallbackHandler';

const AppContent = () => {
  const { isAuthenticated, isLoading } = useEcho();

  if (isLoading) {
    return <div>Initializing Echo SDK...</div>;
  }

  if (!isAuthenticated) {
    return <AuthenticationPanel />;
  }

  return <Dashboard />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/callback" element={<CallbackHandler />} />
      </Routes>
    </Router>
  );
};

export default App;
```

### Dashboard Component

```tsx
import React from 'react';
import UserProfile from './UserProfile';
import BalanceDisplay from './BalanceDisplay';
import TokenPurchase from './TokenPurchase';
import ChatInterface from './ChatInterface';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <UserProfile />
      <BalanceDisplay />
      <TokenPurchase />
      <ChatInterface />
    </div>
  );
};

export default Dashboard;
```

## API Reference

### useEcho Hook Returns

| Property            | Type           | Description                            |
| ------------------- | -------------- | -------------------------------------- |
| `isAuthenticated`   | boolean        | Whether user is authenticated          |
| `isLoading`         | boolean        | Whether SDK is loading                 |
| `user`              | object \| null | User profile data                      |
| `token`             | string \| null | Authentication token                   |
| `balance`           | object \| null | User's token balance                   |
| `error`             | string \| null | Current error message                  |
| `signOut`           | function       | Sign out the current user              |
| `refreshBalance`    | function       | Refresh user's balance                 |
| `createPaymentLink` | function       | Create payment link for token purchase |

### User Object Properties

| Property  | Type                | Description                |
| --------- | ------------------- | -------------------------- |
| `id`      | string              | Unique user identifier     |
| `email`   | string              | User's email address       |
| `name`    | string \| undefined | User's display name        |
| `picture` | string \| undefined | User's profile picture URL |

### Balance Object Properties

| Property   | Type   | Description                     |
| ---------- | ------ | ------------------------------- |
| `credits`  | number | Current credit balance          |
| `currency` | string | Currency unit (e.g., "credits") |

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```tsx
const { error } = useEcho();

if (error) {
  return (
    <div className="error-message">
      Error: {error}
      <button onClick={() => window.location.reload()}>Retry</button>
    </div>
  );
}
```

### 2. Loading States

Provide feedback during loading states:

```tsx
const { isLoading } = useEcho();

if (isLoading) {
  return (
    <div className="loading-spinner">
      <div>⏳</div>
      <p>Loading...</p>
    </div>
  );
}
```

### 3. Conditional Rendering

Check authentication state before rendering protected content:

```tsx
const { isAuthenticated } = useEcho();

return <div>{isAuthenticated ? <ProtectedContent /> : <PublicContent />}</div>;
```

### 4. Token Security

Always include the authentication token in API requests:

```tsx
const { token } = useEcho();

const apiCall = async () => {
  const response = await fetch('/api/endpoint', {
    headers: {
      'x-echo-token': token,
      'Content-Type': 'application/json',
    },
  });
  return response.json();
};
```

# Client Or Server-side Chat Setup

## Client-Side Setup

You can configure LLM providers to run directly in the browser using the Echo token. This approach eliminates the need for a backend server by using the Echo router endpoint directly from your React application.

### Basic Client-Side Configuration

```tsx
import { useEcho } from '@zdql/echo-react-sdk';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

const ClientSideChat = () => {
  const { token } = useEcho();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async e => {
    e.preventDefault();
    if (!input.trim() || !token) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Configure OpenAI to use Echo token and router directly
      const openai = createOpenAI({
        apiKey: token, // Use the Echo token as the API key
        baseURL: 'https://echo.router.merit.systems', // Echo router endpoint
      });

      // Generate response using the configured provider
      const result = await streamText({
        model: openai('gpt-4'), // or your preferred model
        messages: [...messages, userMessage],
      });

      const response = await result.text;

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  return (
    <div>
      <div className="messages">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.role}`}>
            {message.content}
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading || !token}
        />
        <button type="submit" disabled={isLoading || !input.trim() || !token}>
          Send
        </button>
      </form>
    </div>
  );
};
```

### Alternative Client-Side LLM Providers

The same pattern works with other LLM providers:

```tsx
// For Anthropic
import { createAnthropic } from '@ai-sdk/anthropic';

const anthropic = createAnthropic({
  apiKey: token, // Echo token
  baseURL: 'https://echo.router.merit.systems',
});

// For custom providers
import { createProvider } from '@ai-sdk/provider';

const customProvider = createProvider({
  apiKey: token, // Echo token
  baseURL: 'https://echo.router.merit.systems',
});
```

### Required Client-Side Dependencies

Install the AI SDK packages for client-side usage:

```bash
npm install @ai-sdk/openai ai
# or for other providers:
# npm install @ai-sdk/anthropic
```

### Key Configuration Points (Client-Side)

1. **Use Echo Token as API Key**: The token from the Echo SDK must be used as the `apiKey` for your LLM provider
2. **Echo Router URL**: Point your LLM provider's `baseURL` to `https://echo.router.merit.systems`
3. **Automatic Billing**: The Echo system will automatically handle user authentication, credit deduction, and usage tracking
4. **Token Availability**: Ensure the user is authenticated before making LLM requests

### Benefits of Client-Side Setup

- **Simplified Architecture**: No need for a backend API server
- **Reduced Latency**: Direct communication with the Echo router
- **Cost Effective**: Fewer server resources required
- **Real-time Updates**: Direct access to user authentication state

## Server-Side Setup

### Backend Chat Endpoint Example

The Echo SDK acts as a proxy/router for LLM requests. You must configure your LLM provider to use the Echo token as the API key and point to the Echo router endpoint.

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const { createOpenAI } = require('@ai-sdk/openai');
const { streamText } = require('ai');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const token = req.headers['x-echo-token'];
  const { messages } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // Configure OpenAI to use Echo token and router
    const openai = createOpenAI({
      apiKey: token, // Use the Echo token as the API key
      baseURL: 'https://echo.router.merit.systems', // Echo router endpoint
    });

    // Generate response using the configured provider
    const result = await streamText({
      model: openai('gpt-4'), // or your preferred model
      messages: messages,
    });

    // Stream the response back to the client
    const response = await result.text;
    res.json({ text: response });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Chat processing failed' });
  }
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
```

### Key Configuration Points

1. **Use Echo Token as API Key**: The token from the Echo SDK must be used as the `apiKey` for your LLM provider
2. **Echo Router URL**: Point your LLM provider's `baseURL` to `https://echo.router.merit.systems`
3. **Automatic Billing**: The Echo system will automatically handle user authentication, credit deduction, and usage tracking

### Alternative LLM Providers

The same pattern works with other providers through the AI SDK:

```javascript
// For Anthropic
const { createAnthropic } = require('@ai-sdk/anthropic');

const anthropic = createAnthropic({
  apiKey: token, // Echo token
  baseURL: 'https://echo.router.merit.systems',
});

// For other providers
const { createProvider } = require('@ai-sdk/provider');

const customProvider = createProvider({
  apiKey: token, // Echo token
  baseURL: 'https://echo.router.merit.systems',
});
```

### Required Dependencies

Install the necessary packages for your server:

```bash
npm install express cors @ai-sdk/openai ai
# or for other providers:
# npm install @ai-sdk/anthropic
```

## Troubleshooting

### Common Issues

1. **Authentication not working**: Verify your `instanceId` and `redirectUri` configuration
2. **Balance not loading**: Check that the user is authenticated and the API endpoint is accessible
3. **Chat not working**: Ensure the authentication token is being passed correctly in headers
4. **Purchase flow failing**: Verify payment configuration and error handling

### Debug Mode

Enable console logging to debug SDK behavior:

```tsx
const { user, error, isLoading } = useEcho();

useEffect(() => {
  console.log('Echo SDK State:', { user, error, isLoading });
}, [user, error, isLoading]);
```

## Support

For additional support and documentation, visit:

- API Documentation: [https://echo.merit.systems/docs](https://echo.merit.systems/docs)
- GitHub Issues: [Report issues and feature requests](https://github.com/zdql/echo-react-sdk/issues)
