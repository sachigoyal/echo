/**
 * Google Gemini Veo video generation handler
 */

import { getEchoToken } from '@/echo';
import { ERROR_MESSAGES } from '@/lib/constants';
import { GoogleGenAI } from '@google/genai';
/**
 * Handles Google Veo video generation
 */
export async function handleGeminiGenerate(
  prompt: string,
  durationSeconds: number = 4
): Promise<Response> {
  try {
    const apiKey = await getEchoToken();

    if (!apiKey) {
      return Response.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        baseUrl: 'https://echo-staging.up.railway.app',
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

    // Return a proxied URL so the player can access the protected video via server-side auth
    const uri = video.uri;
    if (!uri) {
      return Response.json({ error: 'Missing video uri' }, { status: 500 });
    }

    const proxiedUrl = `/api/proxy-video?uri=${encodeURIComponent(uri)}`;
    return Response.json({
      videoUrl: proxiedUrl,
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
