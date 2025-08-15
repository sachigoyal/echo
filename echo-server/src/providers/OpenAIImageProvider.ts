import { ImagesResponse } from 'openai/resources/images';
import { LlmTransactionMetadata, Transaction } from '../types';
import { BaseProvider } from './BaseProvider';
import { ProviderType } from './ProviderType';

// Use OpenAI SDK's ResponseUsage for non-streaming responses

export const parseSSEImageGenerationFormat = (
  data: string
): ImagesResponse[] => {
  // Split by double newlines to separate complete events
  const eventBlocks = data.split('\n\n');
  const chunks: ImagesResponse[] = [];

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
        'Error parsing SSE image generation chunk:',
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

export class OpenAIImageProvider extends BaseProvider {
  getType(): ProviderType {
    return ProviderType.OPENAI_IMAGES;
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
      let cost = 0;

      const parsed = JSON.parse(data) as ImagesResponse;

      // Extract usage information if available
      if (parsed.usage) {
        input_tokens = parsed.usage.input_tokens || 0;
        output_tokens = parsed.usage.output_tokens || 0;
        total_tokens =
          parsed.usage.total_tokens || input_tokens + output_tokens;
      }

      // Use image-specific cost calculation
      cost = getImageCost(parsed);

      // Extract provider ID if available
      if (parsed.created) {
        providerId = parsed.created.toString();
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
        cost: cost,
        status: 'success',
      };

      return transaction;
    } catch (error) {
      console.error(
        'Error processing OpenAI Image Generation API data:',
        error
      );
      throw error;
    }
  }
}

// Calculates the cost of an OpenAI image generation response (gpt-image-1).
// See: https://platform.openai.com/docs/guides/images/pricing

// Prices per 1M tokens (image tokens):
// Model        Input      Cached Input   Output
// gpt-image-1  $10.00     $2.50          $40.00

// Prices per 1M tokens (text tokens):
// gpt-image-1  $5.00      $1.25

const IMAGE_TOKEN_PRICES = {
  'gpt-image-1': {
    input: 10.0 / 1_000_000,
    cached_input: 2.5 / 1_000_000,
    output: 40.0 / 1_000_000,
    text_input: 5.0 / 1_000_000,
    text_cached_input: 1.25 / 1_000_000,
  },
};

/**
 * Calculate the cost of an image generation response.
 * @param image - The image response from OpenAI
 * @returns The calculated cost in dollars
 */
export const getImageCost = (image: ImagesResponse): number => {
  // Only gpt-image-1 currently supported
  if (!image.usage) {
    return 0;
  }

  // If usage tokens are present, use token-based pricing
  const { input_tokens, output_tokens, input_tokens_details } = image.usage;
  let cost = 0;
  if (input_tokens_details) {
    // Separate image and text tokens if available
    const imageTokens = input_tokens_details.image_tokens || 0;
    const textTokens = input_tokens_details.text_tokens || 0;

    const imageCost = imageTokens * IMAGE_TOKEN_PRICES['gpt-image-1'].input;
    const textCost = textTokens * IMAGE_TOKEN_PRICES['gpt-image-1'].text_input;

    cost += imageCost;
    cost += textCost;
  } else {
    // Fallback: treat all as image tokens
    const inputCost =
      (input_tokens || 0) * IMAGE_TOKEN_PRICES['gpt-image-1'].input;
    cost += inputCost;
  }

  const outputCost =
    (output_tokens || 0) * IMAGE_TOKEN_PRICES['gpt-image-1'].output;
  cost += outputCost;

  return cost;
};
