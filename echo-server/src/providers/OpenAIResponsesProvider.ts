import {
  Response,
  ResponseStreamEvent,
  Tool,
} from 'openai/resources/responses/responses';
import { getCostPerToken } from '../services/AccountingService';
import { LlmTransactionMetadata, Transaction } from '../types';
import { BaseProvider } from './BaseProvider';
import { ProviderType } from './ProviderType';

export const parseSSEResponsesFormat = (
  data: string
): ResponseStreamEvent[] => {
  // Split by double newlines to separate complete events
  const eventBlocks = data.split('\n\n');
  const chunks: ResponseStreamEvent[] = [];

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

// TODO move this somewhere else?
const calculateToolCost = (tool: Tool) => {
  console.log('tool', tool);
  switch (tool.type) {
    case 'image_generation':
      const quality = tool.quality;
      const size = tool.size;

      // GPT Image 1 pricing
      const gptImage1Prices = {
        low: {
          '1024x1024': 0.011,
          '1024x1536': 0.016,
          '1536x1024': 0.016,
        },
        medium: {
          '1024x1024': 0.042,
          '1024x1536': 0.063,
          '1536x1024': 0.063,
        },
        high: {
          '1024x1024': 0.167,
          '1024x1536': 0.25,
          '1536x1024': 0.25,
        },
      };

      // Determine model and pricing - assume gpt-image-1 if no model specified
      if (quality && size) {
        // GPT Image 1 supports low, medium, high (auto defaults to medium)
        const gptQuality = quality === 'auto' ? 'medium' : quality;
        if (gptQuality in gptImage1Prices && size !== 'auto') {
          return (
            gptImage1Prices[gptQuality as keyof typeof gptImage1Prices]?.[
              size
            ] || 0
          );
        }
      }
      return 0;

    case 'code_interpreter':
      // Code Interpreter: $0.03 per container/session
      return 0.03;

    case 'file_search':
      // File search storage: $0.10 / GB per day (1GB free)
      // File search tool call: Responses API only $2.50 / 2k calls = $0.00125 per call
      return 0.00125;

    case 'web_search_preview':
      // Default to gpt-4o pricing, could be enhanced to check model
      // Web search (gpt-4o and gpt-4.1): $25.00 / 1k calls = $0.025 per call
      // Web search (gpt-5, o-series): $10.00 / 1k calls = $0.01 per call
      return 0.025;

    default:
      return 0;
  }
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
      let tool_cost = 0;

      if (this.getIsStream()) {
        const chunks = parseSSEResponsesFormat(data);

        for (const chunk of chunks) {
          // Look for the response.completed event which contains the final usage data
          if (chunk.type === 'response.completed' && chunk.response?.usage) {
            input_tokens = chunk.response.usage.input_tokens || 0;
            output_tokens = chunk.response.usage.output_tokens || 0;
            total_tokens = chunk.response.usage.total_tokens || 0;
            providerId = chunk.response.id || 'null';

            tool_cost = chunk.response.tools.reduce((acc, tool) => {
              return acc + calculateToolCost(tool);
            }, 0);
          }
          // Fallback to any chunk with usage data if no completed event found
          else if (chunk && 'response' in chunk && chunk.response?.usage) {
            input_tokens += chunk.response.usage.input_tokens || 0;
            output_tokens += chunk.response.usage.output_tokens || 0;
            total_tokens += chunk.response.usage.total_tokens || 0;
            providerId = chunk.response?.id || 'null';
          }
          // Keep track of providerId from any chunk
          else if (chunk && 'response' in chunk && chunk.response?.id) {
            providerId = chunk.response?.id || 'null';
          }
        }
      } else {
        const parsed = JSON.parse(data) as Response;
        input_tokens += parsed.usage?.input_tokens || 0;
        output_tokens += parsed.usage?.output_tokens || 0;
        total_tokens += parsed.usage?.total_tokens || 0;
        providerId = parsed.id || 'null';
      }

      const metadata: LlmTransactionMetadata = {
        model: this.getModel(),
        providerId: providerId,
        provider: this.getType(),
        inputTokens: input_tokens,
        outputTokens: output_tokens,
        totalTokens: total_tokens,
        toolCost: tool_cost,
      };

      const transaction: Transaction = {
        metadata: metadata,
        cost:
          getCostPerToken(this.getModel(), input_tokens, output_tokens) +
          tool_cost,
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
