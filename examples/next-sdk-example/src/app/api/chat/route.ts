import { getEchoClient, openai } from '@/echo';
import { convertToModelMessages, streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const echo = await getEchoClient();
  if (!echo) {
    return Response.json({ error: 'User not signed in' }, { status: 401 });
  }
  const user = await echo.users.getUserInfo();
  console.log({ user });

  const result = streamText({
    model: await openai('gpt-4o'),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
