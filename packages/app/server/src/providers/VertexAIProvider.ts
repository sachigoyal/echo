import { Storage } from '@google-cloud/storage';
import { Decimal } from '@prisma/client/runtime/library';
import type { Request } from 'express';
import { Response } from 'express';
import { GoogleAuth } from 'google-auth-library';
import { HttpError, UnknownModelError } from '../errors/http';
import logger from '../logger';
import { EscrowRequest } from '../middleware/transaction-escrow-middleware';
import { prisma } from '../server';
import { getVideoModelPrice } from '../services/AccountingService';
import { EchoDbService } from '../services/DbService';
import type { EchoControlService } from '../services/EchoControlService';
import { Transaction } from '../types';
import { extractOperationId } from '../utils/gemini/string-parsing.js';
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
      }
    | undefined {
    // Only fetchPredictOperation is a proxy endpoint
    if (!req.path.includes(':fetchPredictOperation')) {
      return undefined;
    }

    const model = PROXY_PASSTHROUGH_ONLY_MODEL;
    const isStream = extractIsStream(req);
    const provider = new VertexAIProvider(echoControlService, isStream, model);

    return {
      provider,
      model,
      isStream,
    };
  }

  getType(): ProviderType {
    return ProviderType.VERTEX_AI;
  }

  getBaseUrl(reqPath?: string): string {
    // Simple base URL - formatUpstreamUrl() handles the complex URL construction
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'global';

    if (!project) {
      throw new Error(
        'GOOGLE_CLOUD_PROJECT environment variable not set for Vertex AI'
      );
    }

    return `https://aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google`;
  }

  getApiKey(): string | undefined {
    // Vertex AI uses service account authentication, not API keys
    return undefined;
  }

  override formatUpstreamUrl(req: { path: string; url: string }): string {
    // For Vertex AI, we need to construct the URL differently to avoid /v1 duplication
    const pathWithoutV1 = req.path.replace(/^\/v1/, ''); // Remove /v1 from start
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'global';

    const upstreamUrl = `https://aiplatform.googleapis.com/v1/projects/${project}/locations/${location}${pathWithoutV1}${
      req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''
    }`;
    return upstreamUrl;
  }

  override supportsStream(): boolean {
    // Vertex AI video generation is typically async/long-running, not streaming
    return true;
  }

  override async formatAuthHeaders(
    headers: Record<string, string>
  ): Promise<Record<string, string>> {
    // Now we can get the access token asynchronously
    const accessToken = await this.getAccessToken();
    return {
      ...headers,
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
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

  override transformRequestBody(
    reqBody: Record<string, unknown>,
    reqPath: string
  ): Record<string, unknown> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('User ID is required for Vertex AI requests');
    }

    // Deep clone to avoid mutating the original request body
    const modifiedBody = JSON.parse(JSON.stringify(reqBody));

    // The Google GenAI SDK transforms config.outputGcsUri -> parameters.storageUri
    // So we need to check parameters.storageUri instead
    if (
      modifiedBody.parameters &&
      typeof modifiedBody.parameters === 'object'
    ) {
      const params = modifiedBody.parameters as Record<string, unknown>;
      if (typeof params.storageUri === 'string' && params.storageUri) {
        // Remove gs:// prefix if user accidentally included it
        let path = params.storageUri.startsWith('gs://')
          ? params.storageUri.substring(5)
          : params.storageUri;

        // Encode each path segment to handle special characters, preserving path structure
        const encodedPath = path
          .split('/')
          .map(segment => encodeURIComponent(segment))
          .join('/');

        // Transform: 'echo-template-output-bucket' -> 'gs://echo-veo3-videos/{userId}/echo-template-output-bucket'
        params.storageUri = `gs://echo-veo3-videos/${userId}/${encodedPath}`;
      }
    }

    return modifiedBody;
  }

  /**
   * Transform response to replace GCS URIs with signed URLs
   */
  override async transformResponse(responseData: unknown): Promise<unknown> {
    if (typeof responseData === 'object' && responseData !== null) {
      await this.transformResponseUris(responseData as Record<string, unknown>);
    }
    return responseData;
  }

  /**
   * Parse GCS URI into bucket and file path components
   */
  private parseGcsUri(gcsUri: string): { bucket: string; path: string } {
    const uriWithoutProtocol = gcsUri.substring(5); // Remove 'gs://'
    const firstSlashIndex = uriWithoutProtocol.indexOf('/');
    return {
      bucket: uriWithoutProtocol.substring(0, firstSlashIndex),
      path: uriWithoutProtocol.substring(firstSlashIndex + 1),
    };
  }

  /**
   * Generate a signed URL for a GCS file
   */
  private async generateSignedUrl(
    storage: Storage,
    gcsUri: string,
    expirationMs: number = 3600000 // 1 hour default
  ): Promise<{ signedUrl: string; expiresAt: string }> {
    const { bucket: bucketName, path: filePath } = this.parseGcsUri(gcsUri);
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);
    const expirationTime = Date.now() + expirationMs;

    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: expirationTime,
    });

    return {
      signedUrl,
      expiresAt: new Date(expirationTime).toISOString(),
    };
  }

  /**
   * Transform GCS URIs in the response to signed URLs
   */
  private async transformResponseUris(
    responseData: Record<string, unknown>
  ): Promise<void> {
    if (!responseData.response || typeof responseData.response !== 'object') {
      return;
    }

    const response = responseData.response as Record<string, unknown>;
    const videos = (response.generatedVideos || response.videos) as any[];

    if (!Array.isArray(videos) || videos.length === 0) {
      return;
    }

    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      return;
    }

    const storage = new Storage({
      credentials: JSON.parse(serviceAccountKey),
    });

    for (const video of videos) {
      const videoObj = video.video || video;
      const gcsUri = videoObj.gcsUri || videoObj.uri;

      if (gcsUri && typeof gcsUri === 'string' && gcsUri.startsWith('gs://')) {
        try {
          const { signedUrl, expiresAt } = await this.generateSignedUrl(
            storage,
            gcsUri
          );

          // Replace GCS URI with signed URL
          if (videoObj.gcsUri) {
            videoObj.gcsUri = signedUrl;
          } else {
            videoObj.uri = signedUrl;
          }
          videoObj.expiresAt = expiresAt;
        } catch (error) {
          // Keep original URI if signing fails
          logger.error(`Failed to generate signed URL for ${gcsUri}:`, error);
        }
      }
    }
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
    requestBody: string | FormData | undefined
  ): Promise<void> {
    if (this.getModel() !== PROXY_PASSTHROUGH_ONLY_MODEL) {
      throw new HttpError(400, 'Invalid model');
    }

    // For fetchPredictOperation, extract operation ID from request body
    const requestBodyObj =
      typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody;
    const operationId = extractOperationId(requestBodyObj?.operationName || '');
    if (!operationId) {
      throw new HttpError(400, 'Invalid operation ID');
    }

    // All Vertex AI proxy requests are operations-based, check access control
    if (!(await this.confirmAccessControl(this.getUserId()!, operationId))) {
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
        console.error(
          `Vertex AI request failed. URL: ${upstreamUrl}, Status: ${response.status}, Body:`,
          errorBody
        );
        errorMessage = errorBody || errorMessage;
      } catch (e) {
        console.error(
          `Vertex AI request failed. URL: ${upstreamUrl}, Status: ${response.status}`,
          e
        );
      }
      throw new HttpError(response.status, errorMessage);
    }

    // Vertex AI always returns JSON (never video/mp4 directly)
    const responseData = await response.json();

    // Transform GCS URIs to signed URLs
    await this.transformResponseUris(responseData);

    res.json(responseData);
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
      const operationId = extractOperationId(responseData.name);
      if (!operationId) {
        throw new Error(
          `Failed to extract operation ID from: ${responseData.name}`
        );
      }
      return operationId;
    }

    throw new Error('Response missing operation name');
  }
}
