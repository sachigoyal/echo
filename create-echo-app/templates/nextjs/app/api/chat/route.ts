import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages,
    system: `You are a helpful AI assistant created by Echo Chat. You are friendly, knowledgeable, and always try to be helpful. Keep your responses concise but informative.`,
  });

  return result.toDataStreamResponse();
} 