import { openai } from '@/echo';
// import { openai } from '@ai-sdk/openai';
import { experimental_generateImage as generateImage } from 'ai';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const model = await openai.image('gpt-image-1');
  const result = await generateImage({
    model,
    prompt,
  });

  return Response.json({ imageUrl: result.image });
}
