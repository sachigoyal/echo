import { GenerateVideosResponse, GeneratedVideo } from '@google/genai';
import { Decimal } from '@prisma/client/runtime/library';
import type { Request } from 'express';
import { Response } from 'express';
import { GoogleAuth } from 'google-auth-library';
import { ReadableStream as NodeWebReadableStream } from 'node:stream/web';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { HttpError, UnknownModelError } from '../errors/http';
import logger from '../logger';
import { EscrowRequest } from '../middleware/transaction-escrow-middleware';
import { prisma } from '../server';
import { getVideoModelPrice } from '../services/AccountingService';
import { EchoDbService } from '../services/DbService';
import type { EchoControlService } from '../services/EchoControlService';
import { Transaction } from '../types';
import {
  extractFileId,
  extractOperationId,
  isFilesPath,
  isOperationsPath,
} from '../utils/gemini/string-parsing.js';
import { BaseProvider } from './BaseProvider';
import { ProviderType } from './ProviderType';

export const PROXY_PASSTHROUGH_ONLY_MODEL = 'PROXY_PLACEHOLDER_VERTEX_AI';

// VEO3 models that use Vertex AI
const VEO3_MODELS = [
  'veo-3.0-fast-generate-preview',
  'veo-3.0-generate-preview',
];

export class VertexAIProvider extends BaseProvider {
  private authCache: { token: string; expiry: number } | null = null;

  /**
   * Check if the current model is a VEO3 model that should use Vertex AI
   */
  private isVeo3Model(): boolean {
    return VEO3_MODELS.includes(this.getModel());
  }

  /**
   * Get access token for Vertex AI authentication
   */
  private async getAccessToken(): Promise<string> {
    // Check cache first (with 5 minute buffer)
    if (this.authCache && Date.now() < this.authCache.expiry - 300000) {
      return this.authCache.token;
    }

    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new Error(
        'GOOGLE_SERVICE_ACCOUNT_KEY environment variable not set'
      );
    }

    const auth = new GoogleAuth({
      credentials: JSON.parse(serviceAccountKey),
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();

    if (!tokenResponse.token) {
      throw new Error('Failed to get access token from Google Auth');
    }

    // Cache token with expiry (tokens typically last 1 hour)
    this.authCache = {
      token: tokenResponse.token,
      expiry: Date.now() + 3300000, // 55 minutes
    };

    return tokenResponse.token;
  }

  /**
   * Extract everything AFTER "/models/" from the request path
   */
  private transformVeo3Path(originalPath: string): string {
    // Find "/models/" and take everything after it
    const modelsIndex = originalPath.indexOf('/models/');
    if (modelsIndex === -1) {
      throw new Error(`Path does not contain "/models/": ${originalPath}`);
    }

    // Get everything after "/models/"
    const pathAfterModels = originalPath.substring(
      modelsIndex + '/models/'.length
    );

    // Return the path after models
    return pathAfterModels;
  }

  /**
   * Detects if the request should use Vertex AI passthrough proxy.
   * Returns the initialized provider and metadata if it matches, undefined otherwise.
   */
  static detectPassthroughProxy(
    req: Request,
    echoControlService: EchoControlService,
    extractIsStream: (req: Request) => boolean
  ):
    | {
        provider: BaseProvider;
        model: string;
        isStream: boolean;
        providerId: string;
      }
    | undefined {
    // Check for Vertex AI passthrough patterns:
    // - Files: /v1beta/files/{fileId}
    // - Operations: /v1beta/models/{model}/operations/{operationId}
    // - Operations: /v1beta1/publishers/google/models/{model}/operations/{operationId}
    // - Vertex AI operations: /v1/projects/{project}/locations/{location}/publishers/google/models/{model}:fetchPredictOperation
    const isFilesEndpoint = isFilesPath(req.path);
    const isOperationsEndpoint = isOperationsPath(req.path);
    const isVertexAIOperation =
      req.path.includes(':fetchPredictOperation') ||
      req.path.includes(':predictLongRunning');

    if (!isFilesEndpoint && !isOperationsEndpoint && !isVertexAIOperation) {
      return undefined;
    }

    // Extract provider ID from different path types
    let providerId: string | null = null;

    if (isFilesEndpoint) {
      providerId = extractFileId(req.path);
    } else if (isOperationsEndpoint) {
      providerId = extractOperationId(req.path);
    } else if (isVertexAIOperation) {
      // For Vertex AI operations like :fetchPredictOperation, extract model name as provider ID
      // Path: /v1/projects/{project}/locations/{location}/publishers/google/models/{model}:fetchPredictOperation
      const modelMatch = req.path.match(/\/models\/([^:]+):/);
      providerId = modelMatch?.[1] || null;
    }

    if (!providerId) {
      return undefined;
    }

    const model = PROXY_PASSTHROUGH_ONLY_MODEL;
    const isStream = extractIsStream(req);
    const provider = new VertexAIProvider(echoControlService, isStream, model);

    return {
      provider,
      model,
      isStream,
      providerId,
    };
  }

  getType(): ProviderType {
    return ProviderType.VERTEX_AI;
  }

  getBaseUrl(reqPath?: string): string {
    // Vertex AI uses the AI Platform endpoint
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'global';

    if (!project) {
      throw new Error(
        'GOOGLE_CLOUD_PROJECT environment variable not set for Vertex AI'
      );
    }

    const baseUrl = `https://aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google`;

    if (reqPath) {
      // For Vertex AI, we want:
      // https://aiplatform.googleapis.com/v1/projects/echo-463518/locations/global/publishers/google/models/veo-3.0-generate-preview:predictLongRunning

      // reqPath is: /v1/publishers/google/models/veo-3.0-generate-preview:predictLongRunning
      // We need to strip the /v1 prefix and combine with our base

      const pathWithoutV1Prefix = reqPath.replace(/^\/v1/, ''); // Remove /v1 from start
      const finalUrl = `https://aiplatform.googleapis.com/v1/projects/${project}/locations/${location}${pathWithoutV1Prefix}`;

      // Simple calculation that was working before:
      // We want finalUrl when reqPath is appended
      // So return: finalUrl - reqPath
      const result = finalUrl.substring(0, finalUrl.length - reqPath.length);

      return result;
    }

    return baseUrl;
  }

  getApiKey(): string | undefined {
    // Vertex AI uses service account authentication, not API keys
    return undefined;
  }

  override supportsStream(): boolean {
    // Vertex AI video generation is typically async/long-running, not streaming
    return true;
  }

  override formatAuthHeaders(
    headers: Record<string, string>
  ): Record<string, string> {
    // For Vertex AI, we can't get the access token synchronously here
    // We'll handle auth in a different way
    return {
      ...headers,
      'Content-Type': 'application/json',
    };
  }

  override async handleBody(
    data: unknown,
    requestBody?: Record<string, unknown>
  ): Promise<Transaction> {
    const providerId = this.parseProviderIdFromResponseBody(data);
    if (!requestBody) {
      throw new Error(
        'In Vertex AI, the request body dictates the parameters for the request'
      );
    }

    const durationSeconds: number = Number(requestBody.durationSeconds) || 8;
    const generateAudio: boolean = Boolean(requestBody.generateAudio) || true;

    const videoModelPrice = getVideoModelPrice(this.getModel());

    if (!videoModelPrice) {
      throw new UnknownModelError(
        `No price found for model: ${this.getModel()}`
      );
    }

    const totalCost = new Decimal(
      generateAudio
        ? videoModelPrice.cost_per_second_with_audio
        : videoModelPrice.cost_per_second_without_audio
    ).mul(durationSeconds);

    return {
      metadata: {
        durationSeconds: durationSeconds,
        generateAudio: generateAudio,
        model: this.getModel(),
        providerId: providerId,
        provider: this.getType(),
      },
      rawTransactionCost: totalCost,
      status: 'success',
    };
  }

  override ensureStreamUsage(
    reqBody: Record<string, unknown>
  ): Record<string, unknown> {
    // Vertex AI doesn't use streaming, so no special stream usage handling needed
    return reqBody;
  }

  /**
   * Forwards a proxy request to the provider's API.
   * This will be the last function called in the proxy request chain,
   * and will resolve the request by writing the response to the response object.
   */
  override async forwardProxyRequest(
    req: EscrowRequest,
    res: Response,
    formattedHeaders: Record<string, string>,
    upstreamUrl: string,
    requestBody: string | FormData | undefined,
    providerId: string
  ): Promise<void> {
    if (this.getModel() !== PROXY_PASSTHROUGH_ONLY_MODEL) {
      throw new HttpError(400, 'Invalid model');
    }

    const isOperationsEndpoint = isOperationsPath(upstreamUrl);

    if (
      isOperationsEndpoint &&
      !(await this.confirmAccessControl(this.getUserId()!, providerId))
    ) {
      throw new HttpError(403, 'Access denied');
    }

    // Add Vertex AI authentication
    const accessToken = await this.getAccessToken();
    formattedHeaders = {
      ...formattedHeaders,
      Authorization: `Bearer ${accessToken}`,
    };

    // For Vertex AI requests, construct the full URL with transformed path
    const baseUrl = this.getBaseUrl();
    const pathAfterModels = this.transformVeo3Path(req.path);
    upstreamUrl = `${baseUrl}/models/${pathAfterModels}`;

    console.log(`Vertex AI request: ${req.method} ${upstreamUrl}`);
    console.log('Headers:', JSON.stringify(formattedHeaders, null, 2));
    console.log('Request body:', requestBody ? 'Present' : 'None');

    // Forward the request to the provider's API
    const response = await fetch(upstreamUrl, {
      method: req.method,
      headers: formattedHeaders,
      ...(requestBody && { body: requestBody }),
    });

    // Handle non-200 responses
    if (response.status !== 200) {
      let errorMessage = `${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.text();
        console.error(`Vertex AI request failed. URL: ${upstreamUrl}, Status: ${response.status}, Body:`, errorBody);
        errorMessage = errorBody || errorMessage;
      } catch (e) {
        console.error(`Vertex AI request failed. URL: ${upstreamUrl}, Status: ${response.status}`, e);
      }
      throw new HttpError(response.status, errorMessage);
    }

    if (response.headers.get('content-type') !== 'video/mp4') {
      const responseData = await response.json();
      this.parseCompletedOperationsResponse(responseData);
      res.json(responseData);
      return;
    }

    // Forward important headers
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    if (contentType) res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);

    // Pipe the body
    if (response.body) {
      await pipeline(
        Readable.fromWeb(response.body as NodeWebReadableStream<Uint8Array>),
        res
      );
    } else {
      res.status(500).send('No body in upstream response');
    }
    return;
  }

  async confirmAccessControl(
    userId: string,
    providerId: string
  ): Promise<boolean> {
    const dbService = new EchoDbService(prisma);
    return await dbService.confirmAccessControl(userId, providerId);
  }

  parseProviderIdFromResponseBody(data: unknown): string {
    if (typeof data !== 'string') {
      throw new Error('Expected response data to be a string');
    }

    const responseData = JSON.parse(data);

    if (responseData.name && typeof responseData.name === 'string') {
      return extractOperationId(responseData.name);
    }

    return 'unknown';
  }

  parseCompletedOperationsResponse(
    responseData: Record<string, unknown>
  ): boolean {
    if (!responseData.done) {
      return false;
    }
    const response = responseData.response as
      | GenerateVideosResponse
      | undefined;
    if (!response?.generatedVideos) {
      return false;
    }
    const uris = response.generatedVideos
      .map((video: GeneratedVideo) => video.video?.uri)
      .filter((uri: string | undefined) => uri !== undefined);
    logger.info(
      `Generated video URIs for ${this.getUserId()} and ${responseData.name}: ${JSON.stringify(uris)}`
    );
    return true;
  }
}
