/**
 * Google Gemini image editing handler
 */

import { google } from '@/echo';
import { generateText } from 'ai';
import { getMediaTypeFromDataUrl } from '@/lib/image-utils';

/**
 * Handles Google Gemini image editing
 */
export async function handleGoogleEdit(
  prompt: string,
  imageUrls: string[]
): Promise<Response> {
  const content = [
    {
      type: 'text' as const,
      text: prompt,
    },
    ...imageUrls.map(imageUrl => ({
      type: 'image' as const,
      image: imageUrl, // Direct data URL - Gemini handles it
      mediaType: getMediaTypeFromDataUrl(imageUrl),
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
    imageUrl: `data:${imageFile.mediaType};base64,${imageFile.base64}`,
  });
}
