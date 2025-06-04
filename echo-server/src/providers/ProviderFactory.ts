import { ProviderType } from './ProviderType';
import { BaseProvider } from './BaseProvider';
import { GPTProvider } from './GPTProvider';
import { AnthropicGPTProvider } from './AnthropicGPTProvider';
import { AnthropicNativeProvider } from './AnthropicNativeProvider';
import { UnknownModelError } from '../errors/http';
import { EchoControlService } from '../services/EchoControlService';

export const MODEL_TO_PROVIDER: Record<string, ProviderType> = {
    "gpt-4o": ProviderType.GPT,
    "gpt-4o-mini": ProviderType.GPT,
    "gpt-4o-2024-08-06": ProviderType.GPT,
    "gpt-4o-2024-05-13": ProviderType.GPT,
    "gpt-4o-2024-02-15": ProviderType.GPT,
    "o1-preview": ProviderType.GPT,
    "o3-preview": ProviderType.GPT,   
    "claude-3-5-sonnet-20240620": ProviderType.ANTHROPIC_GPT,
    "claude-3-7-sonnet-20240307": ProviderType.ANTHROPIC_GPT,
    "gpt-3.5-turbo": ProviderType.GPT,
}

export function getProvider(model: string, echoControlService: EchoControlService, stream: boolean, completionPath: string): BaseProvider {

    let type = MODEL_TO_PROVIDER[model];
    if (!type) {
        throw new UnknownModelError(`Unknown model: ${model}`);
    }

    // We select for Anthropic Native if the completionPath includes "messages"
    // The OpenAI Format does not hit /v1/messages, it hits /v1/chat/completions
    // but the anthropic native format hits /v1/messages
    if (type === ProviderType.ANTHROPIC_GPT && completionPath.includes("messages")) {
        type = ProviderType.ANTHROPIC_NATIVE;
    }

    switch (type) {
        case ProviderType.GPT:
            return new GPTProvider(echoControlService, stream, model);
        case ProviderType.ANTHROPIC_GPT:
            return new AnthropicGPTProvider(echoControlService, stream, model);
        case ProviderType.ANTHROPIC_NATIVE:
            return new AnthropicNativeProvider(echoControlService, stream, model);
        default:
            throw new Error(`Unknown provider type: ${type}`);
    }
} 