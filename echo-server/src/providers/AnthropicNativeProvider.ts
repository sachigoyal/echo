import { BaseProvider } from './BaseProvider';
import { ProviderType } from './ProviderType';


export interface AnthropicUsage {
  output_tokens: number;
}

export function parseSSEAnthropicFormat(data: string): AnthropicUsage | null {
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
              if (parsed.type === 'message_delta' && parsed.usage) {
                  usage = {
                      output_tokens: parsed.usage.output_tokens
                  };
              }
          } catch (error) {
              console.error('Error parsing Anthropic SSE chunk:', error);
          }
      }
  }
  
  return usage;
}


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

    formatAuthHeaders(headers: Record<string, string>): Record<string, string> {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('No API key found');
        }
        return {
            ...headers,
            "x-api-key": apiKey
        }
    }

    handleBody(data: string): void {
        if (this.getIsStream()) {
            const usage = parseSSEAnthropicFormat(data);
            if (usage && usage.output_tokens > 0) {
                console.log("Usage tokens: ", usage.output_tokens);
                // Create transaction with proper model info and token details
                this.getEchoControlService().createTransaction({
                    model: this.getModel(), 
                    inputTokens: 0, // Not available in Anthropic streaming
                    outputTokens: usage.output_tokens,
                    totalTokens: usage.output_tokens,
                    cost: usage.output_tokens * 0.015, // Convert tokens to cost (rough estimate for Claude)
                    status: 'success'
                });
            }
        } else {
            const parsed = JSON.parse(data);
            console.log("parsed", parsed);
            throw new Error("Not implemented");
        }
    }

    ensureStreamUsage(reqBody: any): any {
        // usage is always included in the response
        return reqBody;
    }
} 


