import { Request, Response } from 'express';
import { getProvider } from '../providers/ProviderFactory';
import { EchoControlService } from './EchoControlService';
import { isValidModel } from './AccountingService';
import { extractIsStream, extractModelName } from './RequestDataService';
import { handleStreamService } from './HandleStreamService';
import { handleNonStreamingService } from './HandleNonStreamingService';
import { Transaction } from '../types';
import { HttpError, UnknownModelError } from '../errors/http';
import logger from '../logger';

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

    if (!model || !isValidModel(model)) {
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
      throw new UnknownModelError('Invalid model');
    }

    // Format authentication headers
    const authenticatedHeaders = provider.formatAuthHeaders(processedHeaders);

    logger.info(
      'new outbound request',
      `${provider.getBaseUrl(forwardingPath)}${forwardingPath}`,
      req.method
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
      const error = await response.json();
      logger.error(`Error response: ${JSON.stringify(error)}`);
      res.status(response.status).json({
        error: error,
      });
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
}

// Export singleton instance
export const modelRequestService = new ModelRequestService();
