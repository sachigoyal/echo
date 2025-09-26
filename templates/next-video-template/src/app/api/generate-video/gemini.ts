/**
 * Google Gemini Veo video generation handler
 */

import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';
import { ERROR_MESSAGES } from '@/lib/constants';

/**
 * Handles Google Veo video generation
 */
export async function handleGeminiGenerate(
  prompt: string,
  durationSeconds: number = 4
): Promise<Response> {
  try {
    const apiKey = process.env.ECHO_API_KEY;
    
    if (!apiKey) {
      return Response.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        baseUrl: 'http://localhost:3070',
      },
    });

    let operation = await ai.models.generateVideos({
      model: 'veo-3.0-fast-generate-001',
      prompt,
      config: {
        durationSeconds,
      },
    });

    // Poll the operation status until the video is ready
    while (!operation.done) {
      console.log('Waiting for video generation to complete...');
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    const video = operation.response?.generatedVideos?.[0]?.video;
    
    if (!video) {
      return Response.json(
        { error: ERROR_MESSAGES.NO_VIDEO_GENERATED },
        { status: 500 }
      );
    }

    // For now, return the video URI - in a real app you might want to download and serve it
    return Response.json({
      videoUrl: video.uri,
      operationName: operation.name,
    });
  } catch (error) {
    console.error('Gemini video generation error:', error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : ERROR_MESSAGES.NO_VIDEO_GENERATED,
      },
      { status: 500 }
    );
  }
}
