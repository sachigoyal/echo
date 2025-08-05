import { Request } from 'express';
import { BaseProvider } from '../providers/BaseProvider';
import { getProvider } from '../providers/ProviderFactory';
import { EchoControlService } from './EchoControlService';
import { isValidModel } from './AccountingService';
import { extractIsStream, extractModelName } from './RequestDataService';

export interface ModelRequestResult {
  response: Response;
  provider: BaseProvider;
  isStream: boolean;
}

export interface ModelRequestError {
  statusCode: number;
  error: string;
}

export class ModelRequestService {
  /**
   * Validates and executes a model request
   * Returns the raw response from the provider API
   * @param req - Express request object containing the model request
   * @param processedHeaders - Headers processed for authentication
   * @param echoControlService - Service for Echo control operations
   * @param forwardingPath - Path to forward the request to
   * @returns Promise with either the response or an error
   */
  async executeModelRequest(
    req: Request,
    processedHeaders: Record<string, string>,
    echoControlService: EchoControlService,
    forwardingPath: string
  ): Promise<ModelRequestResult | ModelRequestError> {
    // Extract and validate model
    const model = extractModelName(req);

    if (!model || !isValidModel(model)) {
      console.error('Invalid model: ', model);
      return {
        statusCode: 422,
        error: `Invalid model: ${model} Echo does not yet support this model.`,
      };
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
      return {
        statusCode: 422,
        error: `Model ${model} does not support streaming.`,
      };
    }

    // Format authentication headers
    const authenticatedHeaders = provider.formatAuthHeaders(processedHeaders);

    console.log(
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
      console.error('Error response: ', error);
      return {
        statusCode: response.status,
        error: error,
      };
    }

    // Return successful response with provider and stream flag
    return {
      response,
      provider,
      isStream,
    };
  }

  /**
   * Type guard to check if result is an error
   */
  isError(
    result: ModelRequestResult | ModelRequestError
  ): result is ModelRequestError {
    return (
      'statusCode' in result && 'error' in result && !('response' in result)
    );
  }
}

// Export singleton instance
export const modelRequestService = new ModelRequestService();
