/**
 * Google Gemini image generation handler
 */

import { google } from '@/echo';
import { generateText } from 'ai';

/**
 * Handles Google Gemini image generation
 */
export async function handleGoogleGenerate(prompt: string): Promise<Response> {
  const result = await generateText({
    model: google('gemini-2.5-flash-image-preview'),
    prompt,
  });

  const imageFile = result.files?.find(file =>
    file.mediaType?.startsWith('image/')
  );

  if (!imageFile) {
    return Response.json(
      { error: 'No image was generated. Please try a different prompt.' },
      { status: 500 }
    );
  }

  return Response.json({
    imageUrl: `data:${imageFile.mediaType};base64,${imageFile.base64}`,
  });
}
