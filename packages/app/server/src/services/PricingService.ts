import { Request } from 'express';
import { logMetric } from '../logger';
import { BaseProvider } from '../providers/BaseProvider';
import { UnknownModelError } from 'errors/http';
import { getModelPrice } from './AccountingService';
import { Decimal } from '@prisma/client/runtime/library';


function getMaxToken(req: Request, provider: BaseProvider): number {
    const headers = req.headers as Record<string, string>;
    // Estimate input tokens based on content length
    const maxInputTokens = Number(headers['content-length']) * 4;
    switch (provider.getModel()) {
        
    }
    const maxOutputTokens = req.body.maxOutputTokens;
    return Math.max(inputTokens, maxOutputTokens);
}

export async function getRequestMaxCost(
  req: Request,
  provider: BaseProvider
): Promise<{ cost: number }> {
  // switch on the type of model
  const model = provider.getModel();
  const modelPricing = getModelPrice(model);
  //
  if (!modelPricing) {
    logMetric('model.invalid', 1, { model });
    throw new UnknownModelError(`Invalid model: ${model}`);
  }
  const maxContextWindow = modelPricing.max_context_window;

  if (!maxContextWindow) {
    // TODO handle this separately this should probably return
    return { cost: 1.00 };
  }
  return {
    cost: new Decimal(maxContextWindow)
      .mul(
    )
        Math.max(
          new Decimal(modelPricing.input_cost_per_token).toNumber(),
          new Decimal(modelPricing.output_cost_per_token).toNumber()
      )
      .toNumber(),
  };
}
