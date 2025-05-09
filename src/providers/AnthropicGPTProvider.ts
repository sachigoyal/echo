import { ProviderType } from './ProviderType';
import { GPTProvider } from './GPTProvider';

export class AnthropicGPTProvider extends GPTProvider {
    getType(): ProviderType {
        return ProviderType.ANTHROPIC_GPT;
    }

    getBaseUrl(): string {
        // Anthropic API supports OpenAI API format
        // You just have to add /v1 to the end of the URL
        return this.ANTHROPIC_BASE_URL + "/v1";
    }

    getApiKey(): string | undefined {
        return process.env.ANTHROPIC_API_KEY;
    }
} 