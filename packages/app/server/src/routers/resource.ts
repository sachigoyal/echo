import express, { Request, Response, Router } from 'express';
import path from 'path';
import logger, { logMetric } from '../logger';
import { TavilySearchInputSchema } from '../resources/tavily/types';
import {
  calculateTavilySearchCost,
  tavilySearch,
  createTavilyTransaction,
} from '../resources/tavily/tavily';
import { buildX402Response, isApiRequest, isX402Request } from 'utils';
import { authenticateRequest } from 'auth';
import { prisma } from 'server';
import { settle, finalize } from 'handlers';
import { tavilySearchRoute } from '../resources/tavily/route';
const resourceRouter: Router = Router();

resourceRouter.post('/tavily/search', async (req: Request, res: Response) => {
  return await tavilySearchRoute(req, res);
});

export default resourceRouter;
