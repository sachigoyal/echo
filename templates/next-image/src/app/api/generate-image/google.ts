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

  // Find the first image file in the result
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
    imageUrl: {
      base64Data: imageFile.base64,
      mediaType: imageFile.mediaType
    } 
  });
}