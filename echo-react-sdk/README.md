# Echo React SDK

A React SDK for integrating OAuth2 + PKCE authentication and token management with the Echo platform.

## Installation

```bash
npm install @echo-systems/react-sdk
```

## Quick Start

```tsx
import React from 'react';
import {
  EchoProvider,
  EchoSignIn,
  EchoTokenPurchase,
  useEcho,
} from '@echo-systems/react-sdk';

function App() {
  return (
    <EchoProvider config={{ instanceId: 'your-echo-instance-id' }}>
      <Dashboard />
    </EchoProvider>
  );
}

function Dashboard() {
  const { signedIn, user, balance, signOut } = useEcho();

  if (!signedIn) {
    return (
      <div>
        <h1>Welcome to My App</h1>
        <EchoSignIn onSuccess={user => console.log('Signed in:', user)} />
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      <p>Balance: {balance?.credits} credits</p>

      <EchoTokenPurchase
        amount={100}
        onPurchaseComplete={balance =>
          console.log('Purchase complete:', balance)
        }
      />

      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}

export default App;
```

## Configuration

### EchoProvider Props

- `instanceId` (required): Your Echo public key/instance ID
- `apiUrl` (optional): Echo API base URL (defaults to `https://echo.merit.systems`)
- `redirectUri` (optional): OAuth redirect URI (defaults to `{origin}/echo/callback`)
- `scope` (optional): OAuth scope

### OAuth Callback Setup

Ensure your app can handle the OAuth callback at `/echo/callback`. The SDK automatically handles this route when the page loads.

## Components

### EchoSignIn

```tsx
<EchoSignIn
  onSuccess={user => console.log('Signed in:', user)}
  onError={error => console.error('Sign in error:', error)}
  className="custom-signin"
>
  <button>Custom Sign In Button</button>
</EchoSignIn>
```

### EchoTokenPurchase

```tsx
<EchoTokenPurchase
  amount={100}
  onPurchaseComplete={balance => console.log('New balance:', balance)}
  onError={error => console.error('Purchase error:', error)}
  className="custom-purchase"
>
  <button>Buy 100 Tokens</button>
</EchoTokenPurchase>
```

## Hooks

### useEcho

```tsx
const {
  signedIn, // boolean: Authentication status
  user, // EchoUser | null: Current user info
  balance, // EchoBalance | null: Current token balance
  isLoading, // boolean: Loading state
  error, // string | null: Error message
  signIn, // () => Promise<void>: Initiate sign in
  signOut, // () => void: Sign out user
  refreshBalance, // () => Promise<void>: Refresh balance
  createPaymentLink, // (amount: number) => Promise<string>: Create payment link
} = useEcho();
```

## Features

- ✅ **OAuth2 + PKCE Flow**: Secure browser-only authentication
- ✅ **Automatic Token Refresh**: Silent refresh using HTTP-only cookies
- ✅ **TypeScript Support**: Full type definitions included
- ✅ **Tree Shakeable**: Import only what you need
- ✅ **Customizable UI**: Bring your own styling
- ✅ **Error Handling**: Comprehensive error management
- ✅ **Balance Management**: Real-time balance tracking
- ✅ **Payment Integration**: Stripe payment link creation

## Browser Support

- Modern browsers with WebCrypto API support
- Chrome 37+, Firefox 34+, Safari 8+, Edge 12+

## Development

### Running Storybook

To view component documentation and examples:

```bash
bun run storybook
```

This will start Storybook at `http://localhost:6006` with interactive documentation for all components.

### Building Storybook

To build a static version of Storybook:

```bash
bun run build-storybook
```

## License

MIT
