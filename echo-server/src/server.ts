import express, { Request, Response, NextFunction, Express } from 'express';
import dotenv from 'dotenv';
import compression from 'compression';
import cors from 'cors';
import { HttpError } from './errors/http';
import { authenticateRequest } from './auth';
import { modelRequestService } from './services/ModelRequestService';
import { checkBalance } from './services/BalanceCheckService';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3069;

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

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.version,
  });
});

// Main route handler
app.all('*', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { processedHeaders, echoControlService, forwardingPath } =
      await authenticateRequest(
        req.path,
        req.headers as Record<string, string>
      );

    await checkBalance(echoControlService);

    const { transaction, isStream } =
      await modelRequestService.executeModelRequest(
        req,
        res,
        processedHeaders,
        echoControlService,
        forwardingPath
      );

    await echoControlService.createTransaction(transaction);

    modelRequestService.handleResolveStreamingRequest(res, isStream);
  } catch (error) {
    return next(error);
  }
});

// Error handling middleware
app.use((error: Error, req: Request, res: Response) => {
  console.error('Error handling request:', error);

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      error: error.message,
    });
  } else if (error instanceof Error) {
    // Handle other errors with a more specific message
    res.status(500).json({
      error: error.message || 'Internal Server Error',
    });
  } else {
    res.status(500).json({
      error: 'Internal Server Error',
    });
  }
});

// Only start the server if this file is being run directly
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
