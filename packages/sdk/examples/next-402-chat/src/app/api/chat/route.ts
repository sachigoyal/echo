import { convertToModelMessages, generateText, streamText, type UIMessage } from 'ai';
import { createX402OpenAI, UiStreamOnError } from '@merit-systems/echo-aix402-sdk/server';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    model,
    messages,
  }: {
    messages: UIMessage[];
    model: string;
  } = await req.json();

  // Validate required parameters
  if (!model) {
    return new Response(
      JSON.stringify({
        error: 'Bad Request',
        message: 'Model parameter is required',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  if (!messages || !Array.isArray(messages)) {
    return new Response(
      JSON.stringify({
        error: 'Bad Request',
        message: 'Messages parameter is required and must be an array',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const authHeader = req.headers.get('x-payment');
  // Create OpenAI provider with payment authorization
  const openai = createX402OpenAI(
    {
      appId: process.env.ECHO_APP_ID!,
      baseRouterUrl: process.env.ECHO_ROUTER_URL || 'http://localhost:3070',
    },
    authHeader
  );
  // Proceed with actual streaming request
  const result = streamText({
    model: openai(model),
    messages: convertToModelMessages(messages),
    maxRetries: 0,
    maxOutputTokens: 1000,
  });
  return result.toUIMessageStreamResponse({
    headers: {
      'Content-Type': 'text/event-stream',
    },
    onError: UiStreamOnError(),
  });

} 
