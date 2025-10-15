import { buildX402Response, isApiRequest, isX402Request } from 'utils';
import { E2BExecuteInputSchema } from './types';
import { calculateE2BExecuteCost, e2bExecutePythonSnippet, createE2BTransaction } from './e2b';
import { authenticateRequest } from 'auth';
import { prisma } from 'server';
import { settle } from 'handlers';
import { finalize } from 'handlers';
import { Decimal } from '@prisma/client/runtime/library';
import { Request, Response } from 'express';

export async function e2bExecuteRoute(req: Request, res: Response) {
  const headers = req.headers as Record<string, string>;

  const maxCost = calculateE2BExecuteCost();

  if (!isApiRequest(headers) && !isX402Request(headers)) {
    return buildX402Response(req, res, maxCost);
  }

  const inputBody = E2BExecuteInputSchema.safeParse(req.body);
  if (!inputBody.success) {
    return res.status(400).json({ error: 'Invalid body', issues: inputBody.error.issues });
  }
  const parsedBody = inputBody.data;

  if (isApiRequest(headers)) {
    const { echoControlService } = await authenticateRequest(headers, prisma);

    const output = await e2bExecutePythonSnippet(parsedBody.snippet);

    const actualCost = new Decimal(output.cost);
    const transaction = createE2BTransaction(parsedBody, output, actualCost);

    await echoControlService.createTransaction(transaction, actualCost);

    return res.status(200).json(output);
  } else if (isX402Request(headers)) {
    const settleResult = await settle(req, res, headers, maxCost);
    if (!settleResult) {
      return buildX402Response(req, res, maxCost);
    }
    const { payload, paymentAmountDecimal } = settleResult;

    const output = await e2bExecutePythonSnippet(parsedBody.snippet);

    const actualCost = new Decimal(output.cost);
    const transaction = createE2BTransaction(parsedBody, output, actualCost);

    finalize(paymentAmountDecimal, transaction, payload).catch((error) => {
      console.error('Failed to finalize transaction:', error);
    });

    return res.status(200).json(output);
  } else {
    return buildX402Response(req, res, maxCost);
  }
}

