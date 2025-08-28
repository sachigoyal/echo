import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Express, NextFunction, Request, Response } from 'express';
import { authenticateRequest } from './auth';
import logger, { logMetric } from './logger';
import { HttpError } from './errors/http';
import { PrismaClient } from './generated/prisma';
import { traceEnrichmentMiddleware } from './middleware/trace-enrichment-middleware';
import standardRouter from './routers/common';
import { checkBalance } from './services/BalanceCheckService';
import { modelRequestService } from './services/ModelRequestService';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3069;
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL ?? 'postgresql://localhost:5469/echo',
    },
  },
  log: ['warn', 'error'],
});

app.use(traceEnrichmentMiddleware);
// Add middleware
app.use(
  cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowedHeaders: '*', // Allow all headers
    exposedHeaders: '*', // Expose all headers to the client
    credentials: false, // Set to false when using origin: '*'
    preflightContinue: false, // Handle preflight requests here
    optionsSuccessStatus: 200, // Return 200 for preflight OPTIONS requests
  })
);
app.use(express.json({ limit: '100mb' }));
app.use(compression());

// Use common router for utility routes
app.use(standardRouter);

// Main route handler - only for API paths that need authentication
app.all('*', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { processedHeaders, echoControlService, forwardingPath } =
      await authenticateRequest(
        req.path,
        req.headers as Record<string, string>,
        prisma
      );

    await checkBalance(echoControlService);

    const { transaction, isStream, data } =
      await modelRequestService.executeModelRequest(
        req,
        res,
        processedHeaders,
        echoControlService,
        forwardingPath
      );

    await echoControlService.createTransaction(transaction);

    modelRequestService.handleResolveResponse(res, isStream, data);
  } catch (error) {
    return next(error);
  }
});

// Error handling middleware
app.use((error: Error, req: Request, res: Response) => {
  logger.error(
    `Error handling request: ${error.message} | Stack: ${error.stack}`
  );

  if (error instanceof HttpError) {
    logMetric('server.internal_error', 1, {
      error_type: 'http_error',
      error_message: error.message,
    });
    res.status(error.statusCode).json({
      error: error.message,
    });
  } else if (error instanceof Error) {
    logMetric('server.internal_error', 1, {
      error_type: error.name,
      error_message: error.message,
    });
    // Handle other errors with a more specific message
    logger.error('Internal server error', error);
    res.status(500).json({
      error: error.message || 'Internal Server Error',
    });
  } else {
    logMetric('server.internal_error', 1, {
      error_type: 'unknown_error',
    });
    logger.error('Internal server error', error);
    res.status(500).json({
      error: 'Internal Server Error',
    });
  }
});

// Only start the server if this file is being run directly
if (require.main === module) {
  app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });
}

export default app;
