import { HttpError } from 'errors/http';
import { Transaction } from '../types';
import { BaseProvider } from './BaseProvider';
import { ProviderType } from './ProviderType';
import { Decimal } from '@prisma/client/runtime/library';
import { EscrowRequest } from '../middleware/transaction-escrow-middleware';
import { Response } from 'express';

export interface VeoUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface VeoResponse {
  usage?: VeoUsage;
  id?: string;
  // Add other Veo3 response fields as needed
}

export class GeminiVeoProvider extends BaseProvider {
  getType(): ProviderType {
    return ProviderType.GEMINI_VEO;
  }

  getBaseUrl(reqPath?: string): string {
    // For Gemini native API, we use the Google AI API endpoint
    if (reqPath && reqPath.startsWith('/v1beta')) {
      return 'https://generativelanguage.googleapis.com';
    } else {
      return 'https://generativelanguage.googleapis.com/v1beta';
    }
  }

  getApiKey(): string | undefined {
    return process.env.GEMINI_API_KEY;
  }

  override supportsStream(): boolean {
    // Veo3 video generation is typically async/long-running, not streaming
    return true;
  }

  override formatAuthHeaders(
    headers: Record<string, string>
  ): Record<string, string> {
    const apiKey = this.getApiKey();
    if (apiKey === undefined || apiKey.length === 0) {
      throw new Error('No Gemini API key found for Veo3');
    }

    // Veo3 uses Google's API key format, not Bearer token
    return {
      ...headers,
      'x-goog-api-key': apiKey,
    };
  }

  async handleBody(data: string): Promise<Transaction> {
    // Left unimplemented as requested
    return {
      metadata: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        model: this.getModel(),
        providerId: 'null',
        provider: this.getType(),
      },
      rawTransactionCost: new Decimal(0),
      status: 'success',
    };
  }

  override ensureStreamUsage(
    reqBody: Record<string, unknown>
  ): Record<string, unknown> {
    // Veo3 doesn't use streaming, so no special stream usage handling needed
    return reqBody;
  }

  /**
   * Forwards a proxy request to the provider's API.
   * This will be the last function called in the proxy request chain,
   * and will resolve the request by writing the response to the response object.
   *
   * @param req
   * @param res
   * @param formattedHeaders
   * @param upstreamUrl
   * @param requestBody
   * @returns
   */
  override async forwardProxyRequest(
    req: EscrowRequest,
    res: Response,
    formattedHeaders: Record<string, string>,
    upstreamUrl: string,
    requestBody: string | FormData | undefined
  ): Promise<void> {
    // Forward the request to the provider's API
    const response = await fetch(upstreamUrl, {
      method: req.method,
      headers: formattedHeaders,
      ...(requestBody && { body: requestBody }),
    });
    // Handle non-200 responses
    if (response.status !== 200) {
      throw new HttpError(
        response.status,
        `${response.status} ${response.statusText}`
      );
    }

    if (response.headers.get('content-type') !== 'video/mp4') {
      res.json(await response.json());
      return;
    }

    // Forward important headers
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');

    if (contentType) res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    // Pipe the body
    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } else {
      res.status(500).send('No body in upstream response');
    }
    return;
  }
}
