import { Request } from 'express';
import { logMetric } from '../logger';
import { BaseProvider } from '../providers/BaseProvider';
import { UnknownModelError } from 'errors/http';
import { getModelPrice } from './AccountingService';
import { Decimal } from '@prisma/client/runtime/library';
import { ProviderType } from 'providers/ProviderType';


function getMaxToken(req: Request, provider: BaseProvider): number {
    const headers = req.headers as Record<string, string>;
    // Estimate input tokens based on content length
    const maxInputTokens = Number(headers['content-length']) * 4;
    const modelWithPricing = getModelPrice(provider.getModel());
    if (!modelWithPricing) {
        throw new UnknownModelError(`Invalid model: ${provider.getModel()}`);
    }

    return Math.max(maxInputTokens, modelWithPricing.input_cost_per_token);
}

function getMaxOutputTokens(req: Request, provider: BaseProvider): number {
    switch (provider.getType()) {
        case ProviderType.GPT:
            return Number(req.body.maxOutputTokens);
        case ProviderType.ANTHROPIC_GPT:
            return Number(req.body.maxOutputTokens);
        case ProviderType.ANTHROPIC_NATIVE:
            return Number(req.body.maxOutputTokens);
        case ProviderType.GEMINI:
            return Number(req.body.maxOutputTokens);
        case ProviderType.GEMINI_GPT:
            return Number(req.body.maxOutputTokens);
        case ProviderType.GEMINI_VEO:
            return Number(req.body.maxOutputTokens);
        case ProviderType.OPENAI_RESPONSES:
            return Number(req.body.maxOutputTokens);
        case ProviderType.OPENROUTER:
            return Number(req.body.maxOutputTokens);
        case ProviderType.OPENAI_IMAGES:
            return Number(req.body.maxOutputTokens);
        default:
            return Number(req.body.maxOutputTokens);
    }
    
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
