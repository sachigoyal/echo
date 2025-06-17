import { getCostPerToken } from '../services/AccountingService';
import { BaseProvider } from './BaseProvider';
import { ProviderType } from './ProviderType';

export interface AnthropicUsage {
  output_tokens: number;
  id: string;
}

export const parseSSEAnthropicFormat = (
  data: string
): AnthropicUsage | null => {
  // Split by double newlines to separate events
  const events = data.split('\n\n');
  let usage: AnthropicUsage | null = null;

  for (const event of events) {
    if (!event.trim()) continue;
    // find the position of 'data: '
    const dataIndex = event.indexOf('data: ');
    if (dataIndex !== -1) {
      const jsonStr = event.slice(dataIndex + 6); // Remove 'data: ' prefix
      try {
        const parsed = JSON.parse(jsonStr);

        // Look for message_delta event which contains usage information
        if (
          parsed.type === 'message_delta' &&
          parsed.usage !== null &&
          parsed.id
        ) {
          usage = {
            output_tokens: parsed.usage.output_tokens,
            id: parsed.id,
          };
        }

        // Also handle complete message responses
        if (parsed.type === 'message' && parsed.usage !== null && parsed.id) {
          usage = {
            output_tokens: parsed.usage.output_tokens,
            id: parsed.id,
          };
        }
      } catch (error) {
        console.error('Error parsing Anthropic SSE chunk:', error);
      }
    }
  }

  return usage;
};

export class AnthropicNativeProvider extends BaseProvider {
  getType(): ProviderType {
    return ProviderType.ANTHROPIC_NATIVE;
  }

  getBaseUrl(): string {
    return this.ANTHROPIC_BASE_URL;
  }

  getApiKey(): string | undefined {
    return process.env.ANTHROPIC_API_KEY;
  }

  override formatAuthHeaders(
    headers: Record<string, string>
  ): Record<string, string> {
    const apiKey = this.getApiKey();
    if (apiKey === undefined || apiKey.length === 0) {
      throw new Error('No API key found');
    }
    return {
      ...headers,
      'x-api-key': apiKey,
    };
  }

  override handleBody(data: string): void {
    if (this.getIsStream()) {
      const usage = parseSSEAnthropicFormat(data);
      if (usage !== null) {
        // Create transaction with proper model info and token details
        void this.getEchoControlService().createTransaction({
          model: this.getModel(),
          inputTokens: 0, // Not available in Anthropic streaming
          outputTokens: usage.output_tokens,
          totalTokens: usage.output_tokens,
          cost: usage.output_tokens * getCostPerToken(this.getModel()),
          status: 'success',
          providerId: usage.id || 'null',
        });
      }
    } else {
      const parsed = JSON.parse(data);

      const inputTokens = parsed.usage.input_tokens || 0;
      const outputTokens = parsed.usage.output_tokens || 0;
      const totalTokens = inputTokens + outputTokens;

      console.log(
        'Usage tokens (input/output/total): ',
        inputTokens,
        outputTokens,
        totalTokens
      );
      console.log('Message ID: ', parsed.id);

      // Create transaction with proper model info and token details
      void this.getEchoControlService().createTransaction({
        model: this.getModel(),
        inputTokens: inputTokens,
        outputTokens: outputTokens,
        totalTokens: totalTokens,
        cost: totalTokens * getCostPerToken(this.getModel()),
        status: 'success',
        providerId: parsed.id,
      });
    }
  }

  override ensureStreamUsage(
    reqBody: Record<string, unknown>
  ): Record<string, unknown> {
    // usage is always included in the response
    return reqBody;
  }
}
