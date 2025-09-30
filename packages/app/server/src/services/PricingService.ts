import { Request } from 'express';
import { BaseProvider } from '../providers/BaseProvider';
import { UnknownModelError } from 'errors/http';
import {
  getModelPrice,
  getVideoModelPrice,
  isValidImageModel,
  isValidVideoModel,
  calculateToolCost,
} from './AccountingService';
import { Decimal } from '@prisma/client/runtime/library';
import { extractMaxOutputTokens } from './RequestDataService';
import { EscrowRequest } from '../middleware/transaction-escrow-middleware';
import logger from 'logger';
import { ProviderType } from 'providers/ProviderType';
import { Tool } from 'openai/resources/responses/responses';

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
    // TODO(content length is not always available. we can calculate it here if not picked up via middleware once the body is parsed)
    const contentLength = req.originalContentLength || '500000';
    const maxInputTokens = Number(contentLength) / 3;
    const maxOutputTokens = extractMaxOutputTokens(req) || 0; // set to 2k to test
    const modelWithPricing = getModelPrice(provider.getModel());
    if (!modelWithPricing) {
      throw new UnknownModelError(`Invalid model: ${provider.getModel()}`);
    }
    const maxInputCost = new Decimal(maxInputTokens).mul(
      modelWithPricing.input_cost_per_token
    );
    const maxOutputCost = new Decimal(maxOutputTokens).mul(
      modelWithPricing.output_cost_per_token
    );
    // Tool cost for OpenAI Responses API
    const toolCost = predictMaxToolCost(req, provider);
    return maxInputCost.add(maxOutputCost).add(toolCost);
  }
}

function predictMaxToolCost(req: EscrowRequest, provider: BaseProvider): Decimal {
  switch (provider.getType()) {
    case ProviderType.OPENAI_RESPONSES:
      const parsedBody = JSON.parse(req.body) as Record<string, unknown>;
      const tools = parsedBody.tools as Tool[] | undefined;
      
      if (!tools || !Array.isArray(tools) || tools.length === 0) {
        return new Decimal(0);
      }

      let totalToolCost = new Decimal(0);
      
      for (const tool of tools) {
        // Calculate the cost of each tool as specified
        totalToolCost = totalToolCost.add(calculateToolCost(tool));
      }
      
      return totalToolCost;
      
    default:
      return new Decimal(0);
  }
}
