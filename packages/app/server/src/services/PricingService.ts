import { Request } from 'express';
import { BaseProvider } from '../providers/BaseProvider';
import { UnknownModelError } from 'errors/http';
import { getModelPrice } from './AccountingService';
import { Decimal } from '@prisma/client/runtime/library';
import { extractMaxOutputTokens } from './RequestDataService';

export function getRequestMaxCost(
  req: Request,
  provider: BaseProvider
): Decimal {
    // Need to switch between language/image/video for different pricing models.
  const headers = req.headers as Record<string, string>;
  const maxInputTokens = Number(headers['content-length']) * 4;
  const maxOutputTokens = extractMaxOutputTokens(req) || 0;
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
  return maxInputCost.add(maxOutputCost);
}
