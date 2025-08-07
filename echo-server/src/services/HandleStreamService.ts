import { Response as ExpressResponse } from 'express';
import { ReadableStream } from 'stream/web';
import { BaseProvider } from '../providers/BaseProvider';
import { Transaction } from '../types';

export class HandleStreamService {
  /**
   * Duplicates a stream into two independent streams
   * @param stream - The original stream to duplicate
   * @returns A tuple of two independent streams
   */
  private duplicateStream(
    stream: ReadableStream<Uint8Array>
  ): [ReadableStream<Uint8Array>, ReadableStream<Uint8Array>] {
    return stream.tee();
  }

  /**
   * Handles streaming response from the model provider
   * Streams data to the client while simultaneously processing it for accounting
   * @param response - The fetch response from the model provider
   * @param provider - The provider instance for handling the response
   * @param res - Express response object to stream data to the client
   */
  async handleStream(
    response: Response,
    provider: BaseProvider,
    res: ExpressResponse
  ): Promise<Transaction> {
    const bodyStream = response.body as ReadableStream<Uint8Array>;
    if (!bodyStream) {
      throw new Error('No body stream returned from API');
    }

    // Duplicate the stream - one for client, one for processing
    const [stream1, stream2] = this.duplicateStream(bodyStream);

    // Create readers for both streams
    const reader1 = stream1.getReader();
    const reader2 = stream2.getReader();

    // Promise for streaming data to client
    const streamToClientPromise = this.streamToClient(reader1, res);

    // Promise for processing data and creating transaction
    const transactionPromise = this.processStreamData(reader2, provider);

    // Wait for both streams to complete before ending response
    try {
      const [_, transaction] = await Promise.all([
        streamToClientPromise,
        transactionPromise,
      ]);
      res.end();
      return transaction;
    } catch (error) {
      console.error('Error in stream coordination:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream processing failed' });
      }
      throw error; // Re-throw to be handled by error middleware
    }
  }

  /**
   * Streams data directly to the client
   * @param reader - The stream reader for client data
   * @param res - Express response object
   */
  private async streamToClient(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    res: ExpressResponse
  ): Promise<void> {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    } catch (error) {
      console.error('Error reading stream:', error);
      throw error;
    }
  }

  /**
   * Processes stream data for accounting and transaction creation
   * @param reader - The stream reader for processing data
   * @param provider - The provider instance for handling the response
   */
  private async processStreamData(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    provider: BaseProvider
  ): Promise<Transaction> {
    let data = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        data += new TextDecoder().decode(value);
      }
      // Wait for transaction to complete before resolving
      return await provider.handleBody(data);
    } catch (error) {
      console.error('Error processing stream:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const handleStreamService = new HandleStreamService();
