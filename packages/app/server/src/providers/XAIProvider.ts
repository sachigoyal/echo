import { LlmTransactionMetadata, Transaction } from '../types';
import { getCostPerToken } from '../services/AccountingService';
import { BaseProvider } from './BaseProvider';
import { ProviderType } from './ProviderType';
import { CompletionStateBody, parseSSEGPTFormat } from './GPTProvider';
import logger from '../logger';

export class XAIProvider extends BaseProvider {
  private readonly XAI_BASE_URL = 'https://api.x.ai/v1';

  getType(): ProviderType {
    return ProviderType.XAI;
  }

  getBaseUrl(): string {
    return this.XAI_BASE_URL;
  }

  getApiKey(): string | undefined {
    return process.env.XAI_API_KEY;
  }

  override supportsStream(): boolean {
    return true;
  }

  // Allow users to request X Search via OpenAI-like tool call named "web_search_preview"
  override transformRequestBody(
    reqBody: Record<string, unknown>,
    reqPath: string
  ): Record<string, unknown> {
    try {
      // If tools include web_search_preview, set xAI search flag on top-level
      const tools = (reqBody as any)?.tools as unknown[] | undefined;
      if (Array.isArray(tools)) {
        const wantsWebSearch = tools.some(tool => {
          const t = tool as any;
          return (
            t?.type === 'web_search_preview' || t?.name === 'web_search_preview'
          );
        });
        if (wantsWebSearch) {
          (reqBody as any).search = true;
        }
      }
    } catch (e) {
      // best-effort; fall through
    }
    return reqBody;
  }

  async handleBody(data: string): Promise<Transaction> {
    try {
      let prompt_tokens = 0;
      let completion_tokens = 0;
      let total_tokens = 0;
      let providerId = 'null';

      if (this.getIsStream()) {
        const chunks = parseSSEGPTFormat(data);

        for (const chunk of chunks) {
          if (chunk.usage !== null) {
            prompt_tokens += chunk.usage.prompt_tokens;
            completion_tokens += chunk.usage.completion_tokens;
            total_tokens += chunk.usage.total_tokens;
          }
          providerId = chunk.id || 'null';
        }
      } else {
        const parsed = JSON.parse(data) as CompletionStateBody;
        prompt_tokens += parsed.usage.prompt_tokens;
        completion_tokens += parsed.usage.completion_tokens;
        total_tokens += parsed.usage.total_tokens;
        providerId = parsed.id || 'null';
      }

      const cost = getCostPerToken(
        this.getModel(),
        prompt_tokens,
        completion_tokens
      );

      const metadata: LlmTransactionMetadata = {
        providerId: providerId,
        provider: this.getType(),
        model: this.getModel(),
        inputTokens: prompt_tokens,
        outputTokens: completion_tokens,
        totalTokens: total_tokens,
      };

      const transaction: Transaction = {
        rawTransactionCost: cost,
        metadata: metadata,
        status: 'success',
      };

      return transaction;
    } catch (error) {
      logger.error(`Error processing data: ${error}`);
      throw error;
    }
  }
}
