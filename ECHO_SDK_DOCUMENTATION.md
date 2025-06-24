# Echo React SDK Documentation

The Echo React SDK (`@zdql/echo-react-sdk`) provides React integration for OAuth2 authentication, token management, and AI chat capabilities.

Echo allows you to seamlessly connect payment rails and authentication to your LLM application. You can put this entire documentation into Claude code, provide it your app ID, and watch as it creates a prototype of your LLM-based application.

Echo currently supports all OpenAI and Anthropic models.

You will first need to login to https://echo.merit.systems, navigate to the owner dashboard, and create a new app. On the app management page, you will find your app ID and will need to add your callback URL there.

## Installation

```bash
npm install @zdql/echo-react-sdk
```

## Basic Setup

### 1. Configure the EchoProvider

The EchoProvider handles OAuth callbacks automatically - no separate callback route needed!

```tsx
import { EchoProvider } from '@zdql/echo-react-sdk';
import App from './App';

const echoConfig = {
  appId: 'your-app-id',
  apiUrl: 'https://echo.merit.systems',
  // OAuth callbacks are handled automatically at your app's root
  redirectUri: window.location.origin,
};

function Root() {
  return (
    <EchoProvider config={echoConfig}>
      <App />
    </EchoProvider>
  );
}
```

### 2. Configuration Options

| Option        | Type   | Required | Description                                        |
| ------------- | ------ | -------- | -------------------------------------------------- |
| `appId`       | string | ✅       | Your unique Echo app identifier                    |
| `apiUrl`      | string | ✅       | The Echo API base URL                              |
| `redirectUri` | string | ✅       | OAuth callback URL (typically your app's root URL) |

**Note**: The EchoProvider automatically handles OAuth callbacks on any route, so you can set `redirectUri` to your application's root URL.

## Authentication

### useEcho Hook

```tsx
import { useEcho } from '@zdql/echo-react-sdk';

function MyComponent() {
  const { isAuthenticated, isLoading, user, token, signOut } = useEcho();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please sign in</div>;

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### EchoSignIn Component

```tsx
import { EchoSignIn } from '@zdql/echo-react-sdk';

function AuthPanel() {
  return (
    <EchoSignIn
      onSuccess={user => console.log('Signed in:', user)}
      onError={error => console.error('Sign in failed:', error)}
    >
      Sign In with Echo
    </EchoSignIn>
  );
}
```

## Token Balance Management

### Displaying User Balance

```tsx
import { useEcho } from '@zdql/echo-react-sdk';

function BalanceDisplay() {
  const { balance, refreshBalance } = useEcho();

  return (
    <div>
      <span>
        {balance?.credits || 0} {balance?.currency || 'credits'}
      </span>
      <button onClick={refreshBalance}>Refresh</button>
    </div>
  );
}
```

## Token Purchase

### EchoTokenPurchase Component

```tsx
import { EchoTokenPurchase, useEcho } from '@zdql/echo-react-sdk';

function TokenPurchase() {
  const { refreshBalance, createPaymentLink } = useEcho();
  const [amount, setAmount] = useState(100);

  const handleCreatePaymentLink = async () => {
    const paymentLink = await createPaymentLink(amount);
    window.open(paymentLink, '_blank');
  };

  return (
    <div>
      <input
        type="number"
        value={amount}
        onChange={e => setAmount(Number(e.target.value))}
      />

      <EchoTokenPurchase
        amount={amount}
        onPurchaseComplete={() => refreshBalance()}
        onError={error => console.error(error)}
      >
        Purchase {amount} Tokens
      </EchoTokenPurchase>

      <button onClick={handleCreatePaymentLink}>Create Payment Link</button>
    </div>
  );
}
```

## Complete Application Structure

### Simple App Setup (No Routing Required)

```tsx
import { useEcho } from '@zdql/echo-react-sdk';

function AppContent() {
  const { isAuthenticated, isLoading } = useEcho();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <AuthPanel />;

  return <Dashboard />;
}

function App() {
  return <AppContent />;
}
```

### Dashboard Component

```tsx
function Dashboard() {
  return (
    <div>
      <UserProfile />
      <BalanceDisplay />
      <TokenPurchase />
      <ChatInterface />
    </div>
  );
}
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

# Client Or Server-side Chat Setup

## Client-Side Setup

Configure LLM providers to run directly in the browser using the Echo token and router endpoint.

Your Echo token will work with any OpenAI or Anthropic Model.

### AI SDK Configuration

```tsx
import { useEcho } from '@zdql/echo-react-sdk';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

const { token } = useEcho();

const openai = createOpenAI({
  apiKey: token,
  baseURL: 'https://echo.router.merit.systems',
});

const result = await streamText({
  model: openai('gpt-4o'),
  messages: messages,
});
```

### LangChain Configuration

```tsx
import { useEcho } from '@zdql/echo-react-sdk';
import { ChatOpenAI } from '@langchain/openai';

const { token } = useEcho();

const llm = new ChatOpenAI({
  openAIApiKey: token,
  configuration: {
    baseURL: 'https://echo.router.merit.systems',
  },
});
```

### Required Client-Side Dependencies

```bash
# AI SDK
npm install @ai-sdk/openai ai

# LangChain
npm install @langchain/openai @langchain/core

# Other providers
npm install @ai-sdk/anthropic @langchain/anthropic
```

### Key Configuration Points (Client-Side)

1. **Use Echo Token as API Key**: Pass the token as the `apiKey` parameter
2. **Echo Router URL**: Set `baseURL` to `https://echo.router.merit.systems`
3. **Token Availability**: Ensure user is authenticated before making requests

### Key Configuration Points

1. **Use Echo Token as API Key**: Pass the token as the API key parameter
2. **Echo Router URL**: Set `baseURL` to `https://echo.router.merit.systems`
3. **Automatic Billing**: Echo handles authentication, credit deduction, and usage tracking

### Required Dependencies

```bash
# AI SDK
npm install express @ai-sdk/openai ai

# LangChain
npm install express @langchain/openai @langchain/core
```
