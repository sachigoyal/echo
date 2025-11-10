# Echodex

A command-line interface for AI chat powered by [Echo](https://echo.merit.systems) with support for both API key and crypto wallet payments.

## Features

- **Dual Authentication**: Echo API keys or WalletConnect for flexible payment options
- **Multi-Model Support**: GPT-4o, GPT-5, GPT-5 Mini, GPT-5 Nano
- **X402 Protocol**: Pay-per-use with crypto wallets via the X402 payment protocol
- **Conversation Management**: Resume previous conversations and export chat history
- **Secure Storage**: OS keychain integration for credential storage
- **Real-time Usage Tracking**: View your balance and usage in real-time

## Prerequisites

- Node.js 18.0.0 or higher
- pnpm 10.0.0 or higher
- An Echo account (sign up at [echo.merit.systems](https://echo.merit.systems))

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Merit-Systems/echo.git
cd echo/templates/echo-cli
pnpm install
pnpm build
```

### Global Installation (Optional)

To use `echodex` globally:

```bash
pnpm link --global
```

Or use it directly:

```bash
pnpm start
```

## Quick Start

1. **Authenticate with Echo**

   ```bash
   echodex login
   ```

   Choose between:
   - **Echo API Key**: Opens your browser to create an API key
   - **WalletConnect**: Displays a QR code for mobile wallet authentication

2. **Start chatting**

   ```bash
   echodex
   ```

3. **Select a model** (optional)

   ```bash
   echodex model
   ```

## Commands

### Authentication

```bash
echodex login          # Authenticate with Echo (API key or wallet)
echodex logout         # Sign out and clear credentials
```

### Chat

```bash
echodex                # Start a new chat session
echodex resume         # Resume your last conversation
```

### Model Management

```bash
echodex model          # Select a different AI model
```

### History

```bash
echodex history        # View your conversation history
echodex export         # Export conversations as JSON
```

### Profile

```bash
echodex profile        # View your Echo profile and balance
```

## Authentication Methods

### Echo API Key

The Echo API Key method creates an API key via your web browser:

1. Run `echodex login` and select "Echo API Key"
2. Your browser will open to echo.merit.systems
3. Sign in and create an API key
4. The key is securely stored in your OS keychain

### WalletConnect

The WalletConnect method uses the X402 payment protocol:

1. Run `echodex login` and select "WalletConnect"
2. Scan the QR code with your mobile wallet (e.g., MetaMask, Rainbow)
3. Approve the connection
4. Pay for AI usage directly from your wallet

## Configuration

### Required Setup

Before running the CLI, update the configuration in `src/constants.ts`:

1. **Echo App ID**: 
   - Visit [echo.merit.systems](https://echo.merit.systems)
   - Create or retrieve your Echo App ID
   - Replace `YOUR_ECHO_APP_ID` in `src/constants.ts`

2. **WalletConnect Project ID**:
   - Visit [walletconnect.com](https://walletconnect.com)
   - Create a new project and get your Project ID
   - Replace `YOUR_WALLETCONNECT_PROJECT_ID` in `src/constants.ts`

After updating these values, rebuild the project:

```bash
pnpm build
```

### Runtime Configuration

Configuration is stored in:
- **Credentials**: OS keychain (secure)
- **Settings**: `~/.config/echodex/` (platform-specific)

### Available Models

- GPT-4o
- GPT-5
- GPT-5 Mini
- GPT-5 Nano

Switch models anytime with `echodex model`.

## Tech Stack

- **TypeScript**: ESNext with strict mode
- **Echo SDK**: TypeScript SDK for Echo integration
- **Vercel AI SDK**: Streaming AI responses
- **WalletConnect**: Crypto wallet authentication
- **X402 Protocol**: Decentralized payment protocol
- **Keytar**: Secure credential storage
- **Conf**: Configuration management
- **Zod**: Runtime validation
- **Commander**: CLI framework
- **Clack Prompts**: Interactive CLI prompts

## Development

### Running in Development

```bash
pnpm dev
```

### Building

```bash
pnpm build
```

### Project Structure

```
src/
├── auth/           # Authentication logic (API key & WalletConnect)
├── config/         # Configuration, models, and constants
├── core/           # Core features (chat, history, profile)
├── utils/          # Utility functions
├── validation/     # Zod schemas and validators
└── index.ts        # CLI entry point
```

## Troubleshooting

### Keychain Access

If you encounter keychain access issues on macOS:
- Grant Terminal/iTerm2 access in System Preferences → Privacy & Security

### Connection Issues

If WalletConnect fails:
- Ensure you have a stable internet connection
- Try regenerating the QR code
- Check that your wallet supports WalletConnect v2

### Balance Issues

If your balance isn't updating:
- Run `echodex profile` to refresh
- Ensure you're authenticated (run `echodex login` again if needed)

## Support

- **Documentation**: [echo.merit.systems/docs](https://echo.merit.systems/docs)
- **Platform**: [echo.merit.systems](https://echo.merit.systems)
- **GitHub**: [github.com/Merit-Systems/echo](https://github.com/Merit-Systems/echo)
- **Discord**: [discord.gg/merit](https://discord.gg/merit)

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.

## License

MIT

---

Built with ❤️ by [Merit Systems](https://merit.systems)
