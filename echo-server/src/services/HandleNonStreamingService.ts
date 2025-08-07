import { Response as ExpressResponse } from 'express';
import { BaseProvider } from '../providers/BaseProvider';
import { Transaction } from '../types';

export class HandleNonStreamingService {
  /**
   * Handles non-streaming response from the model provider
   * Processes the response and sends it to the client
   * @param response - The fetch response from the model provider
   * @param provider - The provider instance for handling the response
   * @param res - Express response object to send data to the client
   */
  async handleNonStreaming(
    response: Response,
    provider: BaseProvider,
    res: ExpressResponse
  ): Promise<Transaction> {
    // Parse the JSON response
    const data = await response.json();

    // Process the response body for accounting/transaction creation
    const transaction = await provider.handleBody(JSON.stringify(data));

    // Set the appropriate content type
    res.setHeader('content-type', 'application/json');

    // Send the response to the client
    res.json(data);

    return transaction;
  }
}

// Export singleton instance
export const handleNonStreamingService = new HandleNonStreamingService();
