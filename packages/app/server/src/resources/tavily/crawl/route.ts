import { buildX402Response, isApiRequest, isX402Request } from 'utils';
import { TavilyCrawlInputSchema } from './types';
import {
  calculateTavilyCrawlMaxCost,
  calculateTavilyCrawlActualCost,
  tavilyCrawl,
} from './tavily';
import { authenticateRequest } from 'auth';
import { prisma } from 'server';
import { settle } from 'handlers';
import { finalize } from 'handlers';
import { createTavilyTransaction } from './tavily';
import { Request, Response } from 'express';

export async function tavilyCrawlRoute(req: Request, res: Response) {
  const headers = req.headers as Record<string, string>;

  const inputBody = TavilyCrawlInputSchema.safeParse(req.body);

  const maxCost = calculateTavilyCrawlMaxCost(inputBody.data);

  if (!isApiRequest(headers) && !isX402Request(headers)) {
    return buildX402Response(req, res, maxCost);
  }

  if (!inputBody.success) {
    return res
      .status(400)
      .json({ error: 'Invalid body', issues: inputBody.error.issues });
  }

  const parsedBody = inputBody.data;
  const safeMaxCost = calculateTavilyCrawlMaxCost(parsedBody);

  if (isApiRequest(headers)) {
    const { echoControlService } = await authenticateRequest(headers, prisma);

    const output = await tavilyCrawl(parsedBody);

    const actualCost = calculateTavilyCrawlActualCost(parsedBody, output);
    const transaction = createTavilyTransaction(parsedBody, output, actualCost);

    await echoControlService.createTransaction(transaction, actualCost);

    return res.status(200).json(output);
  } else if (isX402Request(headers)) {
    const settleResult = await settle(req, res, headers, safeMaxCost);
    if (!settleResult) {
      return buildX402Response(req, res, maxCost);
    }
    const { payload, paymentAmountDecimal } = settleResult;

    const output = await tavilyCrawl(parsedBody);

    const actualCost = calculateTavilyCrawlActualCost(parsedBody, output);
    const transaction = createTavilyTransaction(parsedBody, output, actualCost);

    await finalize(paymentAmountDecimal, transaction, payload);

    return res.status(200).json(output);
  } else {
    return buildX402Response(req, res, safeMaxCost);
  }
}

