# Echo Chat - AI Chatbot

A modern AI chatbot built with [Next.js](https://nextjs.org/) and [Vercel AI SDK](https://ai-sdk.dev/).

## Features

- 🤖 Real-time AI conversations
- 🎨 Beautiful, responsive UI with Tailwind CSS
- ⚡ Streaming responses for better UX
- 🌙 Dark mode support
- 📱 Mobile-friendly design
- 🔧 Built with TypeScript for type safety

## Getting Started

### Prerequisites

- Node.js 16.x or later
- pnpm (recommended), npm, or yarn

### Installation

1. **Set up environment variables**

   Copy the example environment file and add your API keys:

   ```bash
   cp env.example .env.local
   ```

   Edit `.env.local` and add your OpenAI API key:

   ```env
   OPENAI_API_KEY=your-openai-api-key-here
   ```

   Get your OpenAI API key from: https://platform.openai.com/api-keys

2. **Install dependencies**

   ```bash
   pnpm install
   # or
   npm install
   # or
   yarn install
   ```

3. **Run the development server**

   ```bash
   pnpm dev
   # or
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000) to see your chatbot in action!

## Project Structure

```
├── app/
│   ├── api/chat/          # API route for chat functionality
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout component
│   └── page.tsx          # Main chat interface
├── public/               # Static assets
├── .env.local           # Environment variables (create this)
├── next.config.js       # Next.js configuration
├── package.json         # Dependencies and scripts
├── tailwind.config.js   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

## Customization

### Changing the AI Model

Edit `app/api/chat/route.ts` to use a different model:

```typescript
const result = streamText({
  model: openai('gpt-4'), // Change to your preferred model
  messages,
  system: `Your custom system prompt here`,
});
```

### Styling

The app uses Tailwind CSS for styling. You can:

- Modify `app/globals.css` for global styles
- Update `tailwind.config.js` for theme customization
- Edit component classes directly in the JSX

### Adding Features

Some ideas for extending your chatbot:

- **Message persistence**: Store chat history in a database
- **User authentication**: Add login/signup functionality
- **Multiple conversations**: Support for separate chat threads
- **File uploads**: Allow users to upload images or documents
- **Custom tools**: Integrate external APIs and tools

## Environment Variables

| Variable            | Description                       | Required |
| ------------------- | --------------------------------- | -------- |
| `OPENAI_API_KEY`    | Your OpenAI API key               | Yes      |
| `ANTHROPIC_API_KEY` | Your Anthropic API key (optional) | No       |

## Deployment

The easiest way to deploy your chatbot is to use the [Vercel Platform](https://vercel.com/new).

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add your environment variables in the Vercel dashboard
4. Deploy!

For other deployment options, check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment).

## Learn More

- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Contributing

Found a bug or want to add a feature? Feel free to open an issue or submit a pull request!

## License

This project is open source and available under the [MIT License](LICENSE).
