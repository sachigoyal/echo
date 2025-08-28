import { Request, Response } from 'express';
import { HttpError, UnknownModelError } from '../errors/http';
import logger, { logMetric } from '../logger';
import { getProvider } from '../providers/ProviderFactory';
import { Transaction } from '../types';
import { isValidImageModel, isValidModel } from './AccountingService';
import { EchoControlService } from './EchoControlService';
import { handleNonStreamingService } from './HandleNonStreamingService';
import { handleStreamService } from './HandleStreamService';
import { extractIsStream, extractModelName } from './RequestDataService';

export class ModelRequestService {
  /**
   * Validates and executes a model request, handling the response directly
   * @param req - Express request object containing the model request
   * @param res - Express response object to send the result to
   * @param processedHeaders - Headers processed for authentication
   * @param echoControlService - Service for Echo control operations
   * @param forwardingPath - Path to forward the request to
   * @returns Promise<void> - Handles the response directly
   */
  async executeModelRequest(
    req: Request,
    res: Response,
    processedHeaders: Record<string, string>,
    echoControlService: EchoControlService,
    forwardingPath: string
  ): Promise<{ transaction: Transaction; isStream: boolean; data: unknown }> {
    // Extract and validate model
    const model = extractModelName(req);

    if (!model || (!isValidModel(model) && !isValidImageModel(model))) {
      logger.error(`Invalid model: ${model}`);
      res.status(422).json({
        error: `Invalid model: ${model} Echo does not yet support this model.`,
      });
      throw new UnknownModelError('Invalid model');
    }

    // Extract stream flag
    const isStream = extractIsStream(req);

    // Get the appropriate provider
    const provider = getProvider(
      model,
      echoControlService,
      isStream,
      forwardingPath
    );

    // Validate streaming support
    if (!provider.supportsStream() && isStream) {
      logger.error(`Model does not support streaming: ${model}`);
      res.status(422).json({
        error: `Model ${model} does not support streaming.`,
      });
      logMetric('model.does_not_support_streaming', 1, {
        model: model || 'undefined',
      });
      throw new UnknownModelError('Invalid model');
    }

    // Format authentication headers
    const authenticatedHeaders = provider.formatAuthHeaders(processedHeaders);

    logger.info(
      `New outbound request: ${req.method} ${provider.getBaseUrl(forwardingPath)}${forwardingPath}`
    );

    // Ensure stream usage is set correctly (OpenAI Format)
    req.body = provider.ensureStreamUsage(req.body, forwardingPath);

    // Forward the request to the provider's API
    const response = await fetch(
      `${provider.getBaseUrl(forwardingPath)}${forwardingPath}`,
      {
        method: req.method,
        headers: authenticatedHeaders,
        ...(req.method !== 'GET' && { body: JSON.stringify(req.body) }),
      }
    );

    // Handle non-200 responses
    if (response.status !== 200) {
      const errorMessage = `${response.status} ${response.statusText}`;
      logger.error(`Error response: ${errorMessage}`);
      
      const errorBody = await response.text().catch(() => '');
      const error = this.parseErrorResponse(errorBody, response.status);
      
      logger.error(`Error details: ${JSON.stringify(error)}`);
      res.status(response.status).json({ error });
      throw new HttpError(response.status, JSON.stringify(error));
    }

    // Handle the successful response based on stream type
    if (isStream) {
      const transaction = await handleStreamService.handleStream(
        response,
        provider,
        res
      );
      return { transaction, isStream: true, data: null };
    } else {
      const { transaction, data } =
        await handleNonStreamingService.handleNonStreaming(
          response,
          provider,
          res
        );
      return { transaction, isStream: false, data };
    }
  }

  handleResolveResponse(res: Response, isStream: boolean, data: unknown): void {
    if (isStream) {
      res.end();
    } else {
      res.json(data);
    }
    return;
  }

  private parseErrorResponse(errorBody: string, status: number): object {
    if (!errorBody.trim()) {
      return { message: `HTTP ${status} error` };
    }

    try {
      return JSON.parse(errorBody);
    } catch {
      return { message: errorBody };
    }
  }
}

// Export singleton instance
export const modelRequestService = new ModelRequestService();
