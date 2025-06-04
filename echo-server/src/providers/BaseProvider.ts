import { ProviderType } from './ProviderType';
import { AuthenticationResult, EchoControlService } from '../services/EchoControlService';

export abstract class BaseProvider {
    protected readonly OPENAI_BASE_URL = 'https://api.openai.com/v1';
    protected readonly ANTHROPIC_BASE_URL = 'https://api.anthropic.com';
    protected readonly GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai';

    private authResult: AuthenticationResult;
    private echoControlService: EchoControlService;
    private isStream: boolean;
    private model: string;

    constructor(authResult: AuthenticationResult, echoControlService: EchoControlService, stream: boolean, model: string) {
        this.authResult = authResult;
        this.echoControlService = echoControlService;
        this.isStream = stream;
        this.model = model;
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
    getAuthResult(): AuthenticationResult {
        return this.authResult;
    }
    getEchoControlService(): EchoControlService {
        return this.echoControlService;
    }
    getUser(): string {
        return this.authResult.userId;
    }
    getIsStream(): boolean {
        return this.isStream;
    }
    getModel(): string {
        return this.model;
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