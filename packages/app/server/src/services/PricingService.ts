import { Request } from 'express';
import { BaseProvider } from '../providers/BaseProvider';
import { UnknownModelError } from 'errors/http';
import {
  getModelPrice,
  getVideoModelPrice,
  isValidImageModel,
  isValidVideoModel,
} from './AccountingService';
import { Decimal } from '@prisma/client/runtime/library';
import { extractMaxOutputTokens } from './RequestDataService';
import { EscrowRequest } from '../middleware/transaction-escrow-middleware';
import logger from 'logger';

export function getRequestMaxCost(
  req: EscrowRequest,
  provider: BaseProvider
): Decimal {
  // Need to switch between language/image/video for different pricing models.
  if (isValidVideoModel(provider.getModel())) {
    const videoModelWithPricing = getVideoModelPrice(provider.getModel());
    if (!videoModelWithPricing) {
      throw new UnknownModelError(
        `No pricing found for video model: ${provider.getModel()}`
      );
    }
    const durationSeconds: number = Number(req.body.durationSeconds) || 8;
    const generateAudio: boolean = Boolean(req.body.generateAudio) || true;
    return new Decimal(
      generateAudio
        ? videoModelWithPricing.cost_per_second_with_audio
        : videoModelWithPricing.cost_per_second_without_audio
    ).mul(durationSeconds);
  } else if (isValidImageModel(provider.getModel())) {
    // TODO: Implement image pricing
    return new Decimal(0);
  } else {
    const headers = req.headers as Record<string, string>;
    // Get content-length from preserved value or fallback to headers
    const contentLength = req.originalContentLength || req.get('content-length') || headers['content-length'];
    logger.info(`Content length (preserved): ${contentLength}`);
    logger.info(`Getting model price for model: ${provider.getModel()}`);
    logger.info(`Headers: ${JSON.stringify(headers, null, 2)}`);
    const maxInputTokens = Number(contentLength) / 3;
    logger.info(`Max input tokens: ${maxInputTokens}`);
    const maxOutputTokens = extractMaxOutputTokens(req) || 0;
    const modelWithPricing = getModelPrice(provider.getModel());
    logger.info(`Model with pricing: ${modelWithPricing}`);
    if (!modelWithPricing) {
      throw new UnknownModelError(`Invalid model: ${provider.getModel()}`);
    }
    const maxInputCost = new Decimal(maxInputTokens).mul(
      modelWithPricing.input_cost_per_token
    );
    logger.info(`Max input cost: ${maxInputCost}`);
    const maxOutputCost = new Decimal(maxOutputTokens).mul(
      modelWithPricing.output_cost_per_token
    );
    return maxInputCost.add(maxOutputCost);
  }
}
