import { ProviderType } from './ProviderType';

export abstract class BaseProvider {
    protected readonly OPENAI_BASE_URL = 'https://api.openai.com/v1';
    protected readonly ANTHROPIC_BASE_URL = 'https://api.anthropic.com';
    protected readonly GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai';

    private user: string;
    private isStream: boolean;

    constructor(user: string, stream: boolean) {
        this.user = user;
        this.isStream = stream;
    }

    abstract getType(): ProviderType;
    abstract getBaseUrl(): string;
    abstract getApiKey(): string | undefined;
    formatAuthHeaders(headers: Record<string, string>): Record<string, string> {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('No API key found');
        }
        return {
            ...headers,
            "Authorization": `Bearer ${apiKey}`
        }
    }
    abstract handleBody(data: string): void;
    getUser(): string {
        return this.user;
    }
    getIsStream(): boolean {
        return this.isStream;
    }
    ensureStreamUsage(reqBody: any): any {
        if (this.isStream) {
            reqBody.stream_options = {
                "include_usage": true
            };
        }
        return reqBody;
    }
} 