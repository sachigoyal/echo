# Echo NextJS Example

This example demonstrates how to use the `merit-systems/echo-react-sdk` EchoProvider in a NextJS environment with comprehensive test cases to ensure SSR and CSR compatibility.

## Features

- **Server-Side Rendering (SSR) Compatibility**: Tests that EchoProvider doesn't break during server-side rendering
- **Client-Side Rendering (CSR) Testing**: Validates that the provider works correctly in the browser
- **Authentication Flow Testing**: Demonstrates OAuth integration and authentication states
- **Error Handling Validation**: Tests how the provider handles invalid configurations and error states
- **Configuration Testing**: Validates proper setup and configuration handling

## Prerequisites

- Node.js 18+ and pnpm
- Access to an Echo server (default: `http://localhost:3000`)
- Echo app ID (default test ID provided for development)

## Setup

1. **Install dependencies:**

   ```bash
   cd examples/nextjs
   pnpm install
   ```

2. **Configure environment variables:**
   Copy `env.example` to `.env.local`:

   ```bash
   cp env.example .env.local
   ```

   Update the values in `.env.local`:

   ```env
   NEXT_PUBLIC_ECHO_API_URL=http://localhost:3000
   NEXT_PUBLIC_ECHO_APP_ID=your-echo-app-id-here
   ```

3. **Start the development server:**

   ```bash
   pnpm dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3001` to see the test suite.

## Test Cases

### 1. SSR Compatibility Test 🔄

**Purpose**: Ensures EchoProvider can render during server-side rendering without errors.

**Test Criteria**:

- EchoProvider doesn't throw errors during SSR
- No hydration mismatches occur
- UserManager initialization is properly deferred to client-side
- Component state initializes correctly

**What it tests**: The provider's ability to handle the `typeof window === 'undefined'` condition and properly defer client-only code.

### 2. Client-Side Rendering Test 💻

**Purpose**: Validates that EchoProvider works correctly in client-side rendering environment.

**Test Criteria**:

- `useEcho` hook is accessible within provider
- Context values are properly initialized
- UserManager is created in browser environment
- No client-side errors are thrown

**What it tests**: The `useEcho` hook functionality and context value propagation in a browser environment.

### 3. Authentication Flow Test 🔐

**Purpose**: Tests authentication flow components and functionality.

**Test Criteria**:

- Sign-in and sign-out functions are available
- Authentication state changes are handled
- User information is properly displayed
- Loading states work correctly

**What it tests**: OAuth integration, user state management, and authentication UI components.

### 4. Error Handling Test 🚨

**Purpose**: Tests how EchoProvider handles invalid configurations and error states.

**Test Criteria**:

- Provider handles invalid app IDs gracefully
- Components render even with incorrect configuration
- Error states are properly communicated
- No unhandled exceptions occur

**What it tests**: Resilience of the provider when misconfigured or when authentication fails.

### 5. Configuration Validation Test ⚙️

**Purpose**: Tests EchoProvider configuration validation and setup.

**Test Criteria**:

- Required configuration fields are validated
- Configuration is properly passed to internal components
- Environment variables are correctly loaded
- Default values work as expected

**What it tests**: Configuration parsing, validation, and proper initialization with various config scenarios.

## Testing

### Unit Tests

Run the Jest test suite:

```bash
pnpm test
```

The tests cover:

- EchoProvider rendering in different environments
- Hook functionality and context provision
- SSR compatibility (simulated)
- Error handling with invalid configurations
- State management and initialization

### Manual Testing

1. **SSR Test**: Check the browser's "View Source" to ensure the page renders server-side without client-side JavaScript errors.

2. **Authentication Test**: Click the "Test Sign In" button to initiate the OAuth flow (requires a running Echo server).

3. **Error Handling Test**: Observe how the application handles the intentionally invalid configuration in the Error Handling test case.

4. **Configuration Test**: Verify that all configuration values are properly displayed and that the provider initializes correctly.

## Key Implementation Details

### SSR Handling

The EchoProvider handles SSR by:

- Checking `typeof window !== 'undefined'` before initializing UserManager
- Using `useState` with a function to safely initialize only on the client
- Providing fallback values during server-side rendering

```typescript
const [userManager] = useState(() => {
  // Skip UserManager initialization during SSR
  if (typeof window === 'undefined') {
    return null;
  }
  // Initialize UserManager only in browser
  return new UserManager(settings);
});
```

### NextJS Configuration

The example includes:

- `transpilePackages: ['merit-systems/echo-react-sdk']` in `next.config.js` to ensure proper building
- Custom Jest configuration for testing React components
- TypeScript configuration optimized for NextJS

### Environment Variables

The example supports both server-side (`ECHO_*`) and client-side (`NEXT_PUBLIC_ECHO_*`) environment variables for maximum flexibility.

## Common Issues and Solutions

### 1. Hydration Mismatch Errors

**Problem**: Server and client render different content.
**Solution**: EchoProvider uses proper `useEffect` hooks and conditional rendering to prevent hydration mismatches.

### 2. UserManager Not Initialized

**Problem**: UserManager tries to access `window` during SSR.
**Solution**: UserManager initialization is wrapped in a `typeof window !== 'undefined'` check.

### 3. Build Errors with Echo SDK

**Problem**: NextJS can't properly transpile the Echo SDK.
**Solution**: Add `merit-systems/echo-react-sdk` to `transpilePackages` in `next.config.js`.

### 4. Authentication Redirects Not Working

**Problem**: OAuth redirects fail in development.
**Solution**: Ensure your Echo app is configured with the correct redirect URI (`http://localhost:3001` for this example).

## Production Deployment

For production deployment:

1. Set proper environment variables for your production Echo server
2. Update the redirect URI in your Echo app configuration
3. Ensure your production domain is properly configured in the Echo app settings
4. Test the authentication flow thoroughly in the production environment

## Contributing

When adding new test cases:

1. Create new test case components in `src/components/test-cases/`
2. Add them to the `EchoTestSuite` component
3. Update the test results tracking in the main component
4. Add corresponding unit tests in `__tests__/`
5. Update this README with documentation for the new test case

## Troubleshooting

### Development Server Issues

If you encounter issues starting the development server:

1. Clear NextJS cache: `rm -rf .next`
2. Reinstall dependencies: `rm -rf node_modules && pnpm install`
3. Check that all required environment variables are set
4. Ensure the Echo server is running and accessible

### Testing Issues

If tests fail:

1. Check that Jest and testing dependencies are properly installed
2. Verify mock configurations in `jest.setup.js`
3. Ensure the Echo SDK is properly mocked for testing
4. Check for any TypeScript compilation errors

This example serves as both a testing ground for EchoProvider compatibility and a reference implementation for integrating Echo into NextJS applications.
