import { buildX402Response, isApiRequest, isX402Request } from 'utils';
import { TavilySearchInputSchema } from './types';
import { calculateTavilySearchCost, tavilySearch } from './tavily';
import { authenticateRequest } from 'auth';
import { prisma } from 'server';
import { settle } from 'handlers';
import { finalize } from 'handlers';
import { createTavilyTransaction } from './tavily';
import logger from 'logger';
import { Request, Response } from 'express';

export async function tavilySearchRoute(req: Request, res: Response) {
  try {
    const headers = req.headers as Record<string, string>;

    const inputBody = TavilySearchInputSchema.safeParse(req.body);

    const maxCost = calculateTavilySearchCost(inputBody.data);
    
    if (!isApiRequest(headers) && !isX402Request(headers)) {
        return buildX402Response(req, res, maxCost);
    }

    if (!inputBody.success) {
        return res.status(400).json({ error: 'Invalid body', issues: inputBody.error.issues });
      }
    
      const parsedBody = inputBody.data;
      const safeMaxCost = calculateTavilySearchCost(parsedBody);
    
    if (isApiRequest(headers)) {
      const { echoControlService } = await authenticateRequest(headers, prisma);

      const output = await tavilySearch(parsedBody);

      const transaction = createTavilyTransaction(parsedBody, output, safeMaxCost);

      await echoControlService.createTransaction(transaction, safeMaxCost);

      return res.status(200).json(output);
    } else if (isX402Request(headers)) {
      const settleResult = await settle(req, res, headers, safeMaxCost);
      if (!settleResult) {
        return buildX402Response(req, res, maxCost);
      }
      const { payload, paymentAmountDecimal } = settleResult;

      const output = await tavilySearch(parsedBody);

      const transaction = createTavilyTransaction(parsedBody, output, safeMaxCost);

      await finalize(paymentAmountDecimal, transaction, payload);

      return res.status(200).json(output);
    } else {
      return buildX402Response(req, res, safeMaxCost);
    }
  } catch (error) {
    logger.error('Error searching tavily', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
