/**
 * OpenAI image generation handler
 */

import { openai } from '@/echo';
import { experimental_generateImage as generateImage } from 'ai';

/**
 * Handles OpenAI image generation
 */
export async function handleOpenAIGenerate(prompt: string): Promise<Response> {
  const result = await generateImage({
    model: openai.image('gpt-image-1'),
    prompt,
  });

  const imageData = result.image;
  return Response.json({
    imageUrl: `data:${imageData.mediaType};base64,${imageData.base64}`,
  });
}
