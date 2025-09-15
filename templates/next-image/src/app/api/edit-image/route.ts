import { google } from '@/echo';
import { generateText } from 'ai';

export async function POST(req: Request) {
  try {
    const { prompt, imageUrl } = await req.json();

    if (!prompt || !imageUrl) {
      return Response.json(
        { error: 'Prompt and image data are required' },
        { status: 400 }
      );
    }

    // Support both URLs and data URLs (base64)
    let imageInput: string | URL;
    let mediaType = 'image/jpeg';

    if (imageUrl.startsWith('data:')) {
      // Extract media type from data URL
      const matches = imageUrl.match(/^data:([^;]+)/);
      if (matches) {
        mediaType = matches[1];
      }
      imageInput = imageUrl;
    } else {
      // Regular URL
      imageInput = new URL(imageUrl);
    }

    const result = await generateText({
      model: google('gemini-2.5-flash-image-preview'),
      prompt: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image',
              image: imageInput,
              mediaType,
            },
          ],
        },
      ],
    });

    // Find the first image file in the result
    const imageFile = result.files?.find(file => 
      file.mediaType?.startsWith('image/')
    );

    if (!imageFile) {
      throw new Error('No edited image generated');
    }

    return Response.json({ 
      imageUrl: {
        base64Data: imageFile.base64,
        mediaType: imageFile.mediaType
      } 
    });
  } catch (error) {
    console.error('Image editing error:', error);
    return Response.json(
      { error: 'Failed to edit image' },
      { status: 500 }
    );
  }
}