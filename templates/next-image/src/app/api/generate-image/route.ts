/**
 * API Route: Generate Image
 * 
 * This route demonstrates Echo SDK integration with AI image generation:
 * - Supports both OpenAI and Gemini models
 * - Handles text-to-image generation
 * - Returns base64 encoded images for consistent handling
 * - Provides detailed error messages for debugging
 */

import { openai, google } from '@/echo';
import { experimental_generateImage as generateImage, generateText } from 'ai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, model = 'openai' } = body;

    // Validate required parameters
    if (!prompt || typeof prompt !== 'string') {
      return Response.json(
        { error: 'A valid prompt is required' },
        { status: 400 }
      );
    }

    if (prompt.length < 3) {
      return Response.json(
        { error: 'Prompt must be at least 3 characters long' },
        { status: 400 }
      );
    }

    if (prompt.length > 1000) {
      return Response.json(
        { error: 'Prompt must be less than 1000 characters' },
        { status: 400 }
      );
    }

    if (!['openai', 'gemini'].includes(model)) {
      return Response.json(
        { error: 'Invalid model. Must be "openai" or "gemini"' },
        { status: 400 }
      );
    }

    if (model === 'gemini') {
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
    } else {
      // Default to OpenAI
      const result = await generateImage({
        model: openai.image('gpt-image-1'),
        prompt,
      });

      return Response.json({ imageUrl: result.image });
    }
  } catch (error) {
    console.error('Image generation error:', error);
    
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
          { error: 'Content does not meet safety guidelines. Please try a different prompt.' },
          { status: 400 }
        );
      }
    }
    
    return Response.json(
      { error: 'Image generation failed. Please try again later.' },
      { status: 500 }
    );
  }
}
