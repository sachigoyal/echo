/**
 * Google Gemini Veo video generation handler
 */

import { getEchoToken } from '@/echo';
import { ERROR_MESSAGES } from '@/lib/constants';
import { GenerateVideosOperation, GoogleGenAI } from '@google/genai';
/**
 * Initiates Google Veo video generation and returns operation immediately
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
      vertexai: true,
      httpOptions: {
        baseUrl: 'http://localhost:3070',
        apiVersion: 'v1',
      },
    });

    const operation = await ai.models.generateVideos({
      // model: 'veo-3.0-fast-generate-001',
      model: 'veo-3.0-fast-generate-preview',
      prompt,
      config: {
        durationSeconds,
      },
    });

    console.log('operation: ', operation);

    // Return the SDK operation directly - no wrapper needed
    return Response.json(operation);
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

/**
 * Checks the status of a video generation operation
 * Can accept either a full operation object or just the operation name
 */
export async function checkGeminiOperationStatus(
  operationOrName: GenerateVideosOperation | string
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
      vertexai: true,
      httpOptions: {
        baseUrl: 'http://localhost:3070',
        apiVersion: 'v1',
      },
    });

    // Handle both operation object and operation name string
    let operation: GenerateVideosOperation;
    if (typeof operationOrName === 'string') {
      operation = new GenerateVideosOperation();
      operation.name = operationOrName;
    } else {
      operation = operationOrName;
    }

    // Use the SDK method to check operation status
    const updatedOperation = await ai.operations.getVideosOperation({
      operation: operation,
    });

    console.log('updatedOperation: ', updatedOperation);

    // Just return the SDK operation response directly
    return Response.json(updatedOperation);
  } catch (error) {
    console.error('Error checking operation status:', error);
    return Response.json(
      {
        status: 'failed',
        error:
          error instanceof Error
            ? error.message
            : 'Failed to check operation status',
      },
      { status: 500 }
    );
  }
}
