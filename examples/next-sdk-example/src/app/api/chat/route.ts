import { google } from '@/echo';
import { convertToModelMessages, generateText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await generateText({
    model: await google.chat('gemini-2.5-flash'),
    messages: convertToModelMessages(messages),
  });

  return Response.json(result.text);
}
