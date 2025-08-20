import { baseUrl, getEchoToken } from '@/echo';
import { createOpenAI } from '@ai-sdk/openai';
import { convertToModelMessages, generateText, streamText } from 'ai';

// OPTION 1:
// overide the provider base url with the create*() function
// Inject the echo token into the headers directly in generateText()
export async function POST(req: Request) {
  const { messages } = await req.json();
  const echoToken = await getEchoToken();

  const openai = createOpenAI({
    baseURL: baseUrl,
    apiKey: echoToken ?? '',
  });

  const result = streamText({
    model: openai('gpt-4o'),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
