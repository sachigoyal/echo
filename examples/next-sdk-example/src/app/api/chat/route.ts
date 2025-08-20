import { openai } from '@/echo';
import { convertToModelMessages, streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: await openai('gpt-4o'),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
