/**
 * Google Gemini image editing handler
 */

import { google } from '@/echo';
import { generateText } from 'ai';
import { parseImageInput } from './parse';

/**
 * Handles Google Gemini image editing
 */
export async function handleGoogleEdit(
  prompt: string,
  imageUrls: string[]
): Promise<Response> {
  const imageInputs = imageUrls.map(parseImageInput);

  const content = [
    {
      type: 'text',
      text: prompt,
    },
    ...imageInputs.map(imageInput => ({
      type: 'image' as const,
      image: imageInput.data,
      mediaType: imageInput.mediaType,
    })),
  ];

  const result = await generateText({
    model: google('gemini-2.5-flash-image-preview'),
    prompt: [
      {
        role: 'user',
        content,
      },
    ],
  });

  // Find the first image file in the result
  const imageFile = result.files?.find(file =>
    file.mediaType?.startsWith('image/')
  );

  if (!imageFile) {
    return Response.json(
      {
        error:
          'No edited image was generated. Please try a different edit prompt.',
      },
      { status: 500 }
    );
  }

  return Response.json({
    imageUrl: {
      base64Data: imageFile.base64,
      mediaType: imageFile.mediaType,
    },
  });
}
