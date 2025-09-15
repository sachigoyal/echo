/**
 * API Route: Edit Image
 * 
 * This route demonstrates Echo SDK integration with AI image editing:
 * - Uses Gemini model for image-to-image transformations
 * - Supports both data URLs (base64) and regular URLs as input
 * - Validates input images and prompts
 * - Returns edited images in base64 format
 */

import { google } from '@/echo';
import { generateText } from 'ai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, imageUrl } = body;

    // Validate required parameters
    if (!prompt || typeof prompt !== 'string') {
      return Response.json(
        { error: 'A valid prompt is required for image editing' },
        { status: 400 }
      );
    }

    if (prompt.length < 3) {
      return Response.json(
        { error: 'Edit prompt must be at least 3 characters long' },
        { status: 400 }
      );
    }

    if (prompt.length > 1000) {
      return Response.json(
        { error: 'Edit prompt must be less than 1000 characters' },
        { status: 400 }
      );
    }

    if (!imageUrl || typeof imageUrl !== 'string') {
      return Response.json(
        { error: 'Image data is required for editing' },
        { status: 400 }
      );
    }

    // Support both URLs and data URLs (base64)
    let imageInput: string | URL;
    let mediaType = 'image/jpeg';

    if (imageUrl.startsWith('data:')) {
      // Extract media type from data URL
      const matches = imageUrl.match(/^data:([^;]+);base64,/);
      if (!matches) {
        return Response.json(
          { error: 'Invalid image data format' },
          { status: 400 }
        );
      }
      mediaType = matches[1];
      
      // Validate that it's an image type
      if (!mediaType.startsWith('image/')) {
        return Response.json(
          { error: 'Only image files can be edited' },
          { status: 400 }
        );
      }
      
      imageInput = imageUrl;
    } else {
      // Regular URL - validate format
      try {
        imageInput = new URL(imageUrl);
      } catch {
        return Response.json(
          { error: 'Invalid image URL format' },
          { status: 400 }
        );
      }
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
      return Response.json(
        { error: 'No edited image was generated. Please try a different edit prompt.' },
        { status: 500 }
      );
    }

    return Response.json({ 
      imageUrl: {
        base64Data: imageFile.base64,
        mediaType: imageFile.mediaType
      } 
    });
  } catch (error) {
    console.error('Image editing error:', error);
    
    // Provide more specific error messages based on the error type
    if (error instanceof Error) {
      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        return Response.json(
          { error: 'Rate limit exceeded. Please try again in a few moments.' },
          { status: 429 }
        );
      }
      
      if (error.message.includes('authentication') || error.message.includes('auth')) {
        return Response.json(
          { error: 'Authentication failed. Please check your API credentials.' },
          { status: 401 }
        );
      }
      
      if (error.message.includes('content policy') || error.message.includes('safety')) {
        return Response.json(
          { error: 'Content does not meet safety guidelines. Please try different images or prompts.' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('unsupported') || error.message.includes('format')) {
        return Response.json(
          { error: 'Unsupported image format. Please use JPEG, PNG, or WebP images.' },
          { status: 400 }
        );
      }
    }
    
    return Response.json(
      { error: 'Image editing failed. Please try again later.' },
      { status: 500 }
    );
  }
}