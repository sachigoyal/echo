import { PROXY_PASSTHROUGH_ONLY_MODEL } from "./VertexAIProvider";
import { BaseProvider } from './BaseProvider';
import { Request } from 'express';
import { ProviderType } from './ProviderType';
import { EscrowRequest } from '../middleware/transaction-escrow-middleware';
import { Response } from 'express';
import { getVideoModelPrice } from "services/AccountingService";
import { HttpError, UnknownModelError } from "errors/http";
import { Decimal } from "generated/prisma/runtime/library";
import { Transaction } from '../types';

export class OpenAIVideoProvider extends BaseProvider {

    static detectPassThroughProxy(
        req: Request,
        extractIsStream: (req: Request) => boolean
    ): 
    | {
        provider: BaseProvider;
        model: string;
        isStream: boolean;
    }
    | undefined {
        if (req.path.endsWith('/videos') || req.path.endsWith('/remix')) {
            return undefined;
        }

        const model = PROXY_PASSTHROUGH_ONLY_MODEL;
        const isStream = extractIsStream(req);
        const provider = new OpenAIVideoProvider(isStream, model);

        return {
            provider,
            model,
            isStream,
        };
    }

    // ========== Provider Interface ==========

    getType(): ProviderType {
        return ProviderType.OPENAI_VIDEOS;
    }

    getBaseUrl(): string {
        return this.OPENAI_BASE_URL;
    }

    getApiKey(): string | undefined {
        return process.env.OPENAI_API_KEY;
    }

    override handleBody(
        data: string,
        requestBody?: Record<string, unknown>
    ): Promise<Transaction> {
        const providerId = this.parseProviderIdFromResponseBody(data);
        if (!requestBody) {
            throw new Error('Request body is required for OpenAI Videos');
        }

        const durationSeconds = Number(requestBody.seconds) || 4;
        // TODO: Size pricing??
        const size = requestBody.size || '720x1280';
        const videoModelPrice = getVideoModelPrice(this.getModel());

        if (!videoModelPrice) {
            throw new UnknownModelError(
                `No price found for model ${this.getModel()}`
            );
        }
        const costPerSecond = videoModelPrice.cost_per_second_with_audio;
        // TODO: Calculate cost based on size
        const totalCost = new Decimal(costPerSecond).mul(durationSeconds);

        return {
            metadata: {
              durationSeconds,
              generateAudio: true,
              model: this.getModel(),
              providerId,
              provider: this.getType(),
            },
            rawTransactionCost: totalCost,
            status: 'success',
          };
    }

    // ========== Response Parsing ==========

    parseProviderIdFromResponseBody(data: unknown): string {
        if (typeof data !== 'string') {
            throw new Error('Expected response data to be a string');
        }

        const responseData = JSON.parse(data);

        if (responseData.id && typeof responseData.id === 'string') {
            return responseData.id;
        }

        throw new Error('Response missing ID');
    }

    override async forwardProxyRequest(
        req: EscrowRequest,
        res: Response,
        formattedHeaders: Record<string, string>,
        upstreamUrl: string,
        requestBody: string | FormData | undefined
    ): Promise<void> {
    if (this.getModel() !== PROXY_PASSTHROUGH_ONLY_MODEL) {
            throw new HttpError(400, 'Invalid model');
    }

    // TODO: Add Access control here
    const response = await fetch(
        upstreamUrl, {
            method: req.method,
            headers: formattedHeaders,
            ...(requestBody && { body: requestBody }),
        }
    );
    const responseData = await response.json();
    res.json(responseData);
    }
}