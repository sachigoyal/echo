# Echo TypeScript CLI SDK

This package contains the CLI functionality for the Echo platform. It includes the command-line interface for managing Echo apps, authentication, and other CLI-specific features.

## Installation

To use this as a base for your project, copy the folder 'echo-typescript-cli-example' and install the project with pnpm.

## Usage

This package includes CLI helpers and commands for interacting with the Echo platform from the command line.

Running the below command will build the CLI example and allow you to replace 'pnpm start' with 'echo-example'.

```bash
pnpm i

pnpm link

echo-example login
```

### Authentication

You can authenticate with Echo in two ways:

#### Option 1: Using API Key directly

```bash
# Save your API key directly to .env file
pnpm start login --key your_api_key_here
```

#### Option 2: Browser-based authentication

```bash
# Open browser to get API key from Echo dashboard
pnpm start login
```

### Available Commands

```bash
# Login with API key
pnpm start login --key <your-api-key>

# Login via browser
pnpm start login

# Check account balance
pnpm start balance

# Chat with AI model
pnpm start chat "Hello, how are you?"

# Generate payment link
pnpm start payment --amount 10 --description "Add credits"

# Logout
pnpm start logout
```

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm run build

# simulates the script
pnpm start
```

To register this example app with your own Echo App, create an Echo App on echo.merit.sytems and replace the app ID used in config.ts.

Then, rebuild your application and log in once again. You will now be sending tokens to your application.

Happy Hacking!
