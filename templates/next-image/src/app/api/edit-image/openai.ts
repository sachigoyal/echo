/**
 * OpenAI image editing handler
 */

import { getEchoToken } from '@/echo';
import OpenAI from 'openai';
import { toFile } from './parse';

/**
 * Handles OpenAI image editing
 */
export async function handleOpenAIEdit(prompt: string, imageUrls: string[]): Promise<Response> {
  const token = await getEchoToken();
  
  if (!token) {
    return Response.json(
      { error: 'Authentication failed. No token available.' },
      { status: 401 }
    );
  }

  // OpenAI editImage API is not supported through Vercel AI SDK, so we must construct
  // a raw TS OpenAI client. 
  // https://platform.openai.com/docs/api-reference/images/createEdit
  const openaiClient = new OpenAI({
    apiKey: token,
    baseURL: 'https://echo.router.merit.systems',
  });

  try {
    const imageFiles = await Promise.all(imageUrls.map(url => toFile(url)));

    const result = await openaiClient.images.edit({
      image: imageFiles,
      prompt,
      n: 1,
      size: '1024x1024',
      model: 'gpt-image-1',
    });

    if (!result.data || result.data.length === 0) {
      return Response.json(
        { error: 'No edited image was generated. Please try a different edit prompt.' },
        { status: 500 }
      );
    }

    return Response.json({
      imageUrl: {
        base64Data: result.data[0]?.b64_json,
        mediaType: 'image/png'
      }
    });
  } catch (error: any) {
    // Pass through OpenAI's error response directly
    if (error?.status && error?.message) {
      return Response.json(
        { error: error.message },
        { status: error.status }
      );
    }
    throw error; // Re-throw for main error handler to catch
  }
}