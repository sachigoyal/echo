import { getCostPerToken } from '../services/AccountingService';
import { BaseProvider } from './BaseProvider';
import { ProviderType } from './ProviderType';
import { LlmTransactionMetadata, Transaction } from '../types';

export interface ResponseCompletionBody {
  id: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
}

export interface ResponseStreamingChunkBody {
  id: string;
  type: string;
  eventType?: string; // Added to track the SSE event type (e.g., 'response.completed')
  response?: {
    id: string;
    usage?: {
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
    };
  };
}

export const parseSSEResponsesFormat = (
  data: string
): ResponseStreamingChunkBody[] => {
  // Split by double newlines to separate complete events
  const eventBlocks = data.split('\n\n');
  const chunks: ResponseStreamingChunkBody[] = [];

  for (const eventBlock of eventBlocks) {
    if (!eventBlock.trim()) continue;

    // Parse event block that may contain multiple lines
    const lines = eventBlock.split('\n');
    let eventType = '';
    let eventData = '';

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        eventType = line.slice(7); // Remove 'event: ' prefix
      } else if (line.startsWith('data: ')) {
        eventData = line.slice(6); // Remove 'data: ' prefix
      }
    }

    // Skip if no data found or if it's a [DONE] marker
    if (!eventData || eventData.trim() === '[DONE]') continue;

    try {
      const parsed = JSON.parse(eventData);
      // Add the event type to the parsed object for easier identification
      parsed.eventType = eventType;
      chunks.push(parsed);
    } catch (error) {
      console.error(
        'Error parsing SSE chunk:',
        error,
        'Event type:',
        eventType,
        'Data:',
        eventData
      );
    }
  }

  return chunks;
};

export class OpenAIResponsesProvider extends BaseProvider {
  getType(): ProviderType {
    return ProviderType.OPENAI_RESPONSES;
  }

  getBaseUrl(): string {
    return this.OPENAI_BASE_URL;
  }

  getApiKey(): string | undefined {
    return process.env.OPENAI_API_KEY;
  }

  async handleBody(data: string): Promise<Transaction> {
    try {
      let input_tokens = 0;
      let output_tokens = 0;
      let total_tokens = 0;
      let providerId = 'null';

      if (this.getIsStream()) {
        const chunks = parseSSEResponsesFormat(data);

        for (const chunk of chunks) {
          // Look for the response.completed event which contains the final usage data
          if (
            chunk.eventType === 'response.completed' &&
            chunk.response?.usage
          ) {
            input_tokens = chunk.response.usage.input_tokens || 0;
            output_tokens = chunk.response.usage.output_tokens || 0;
            total_tokens = chunk.response.usage.total_tokens || 0;
            providerId = chunk.response.id || 'null';
            break; // We only need the final completed event
          }
          // Fallback to any chunk with usage data if no completed event found
          else if (chunk.response?.usage) {
            input_tokens += chunk.response.usage.input_tokens || 0;
            output_tokens += chunk.response.usage.output_tokens || 0;
            total_tokens += chunk.response.usage.total_tokens || 0;
            providerId = chunk.response?.id || chunk.id || 'null';
          }
          // Keep track of providerId from any chunk
          else if (chunk.response?.id || chunk.id) {
            providerId = chunk.response?.id || chunk.id || 'null';
          }
        }
      } else {
        const parsed = JSON.parse(data) as ResponseCompletionBody;
        input_tokens += parsed.usage.input_tokens || 0;
        output_tokens += parsed.usage.output_tokens || 0;
        total_tokens += parsed.usage.total_tokens || 0;
        providerId = parsed.id || 'null';
      }

      const metadata: LlmTransactionMetadata = {
        model: this.getModel(),
        providerId: providerId,
        provider: this.getType(),
        inputTokens: input_tokens,
        outputTokens: output_tokens,
        totalTokens: total_tokens,
      };

      const transaction: Transaction = {
        metadata: metadata,
        rawTransactionCost: getCostPerToken(
          this.getModel(),
          input_tokens,
          output_tokens
        ),
        status: 'success',
      };

      return transaction;
    } catch (error) {
      console.error('Error processing OpenAI Responses API data:', error);
      throw error;
    }
  }

  // Override ensureStreamUsage since Responses API doesn't use stream_options
  override ensureStreamUsage(
    reqBody: Record<string, unknown>,
    reqPath: string
  ): Record<string, unknown> {
    // Responses API handles usage tracking differently - no need to modify the request
    return reqBody;
  }
}
