import compression from 'compression';
import { CdpClient } from '@coinbase/cdp-sdk';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Express, NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { authenticateRequest } from './auth';
import logger, { logMetric } from './logger';
import { HttpError, PaymentRequiredError } from './errors/http';
import { PrismaClient } from './generated/prisma';
import { traceEnrichmentMiddleware } from './middleware/trace-enrichment-middleware';
import {
  TransactionEscrowMiddleware,
  EscrowRequest,
} from './middleware/transaction-escrow-middleware';
import standardRouter from './routers/common';
import inFlightMonitorRouter from './routers/in-flight-monitor';
import { checkBalance } from './services/BalanceCheckService';
import { modelRequestService } from './services/ModelRequestService';
import { Network, X402ChallengeParams } from './types';
import { ERC20_CONTRACT_ABI, USDC_ADDRESS } from 'services/fund-repo/constants';
import { Abi, encodeFunctionData } from 'viem';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3069;

// Configure multer for handling form data and file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL ?? 'postgresql://localhost:5469/echo',
    },
  },
  log: ['warn', 'error'],
});

// Initialize the transaction escrow middleware
const transactionEscrowMiddleware = new TransactionEscrowMiddleware(prisma);

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
app.use(upload.any()); // Handle multipart/form-data with any field names
app.use(compression());

// Use common router for utility routes
app.use(standardRouter);

// Use in-flight monitor router for monitoring endpoints
app.use(inFlightMonitorRouter);

function isApiRequest(headers: Record<string, string>): boolean {
  return headers['x-api-key'] !== undefined;
}

function isX402Request(headers: Record<string, string>): boolean {
  return headers['x-402-challenge'] !== undefined;
}

function buildX402Response(res: Response, amount: string, network: Network) {
  const paymentUrl = `${process.env.ECHO_ROUTER_BASE_URL}/api/v1/${network}/payment-link?amount=${encodeURIComponent(amount)}`;

  res.setHeader(
    'WWW-Authenticate',
    buildX402Challenge({
      realm: 'echo',
      link: paymentUrl,
      network,
    })
  )

  return res.status(402).json({
    error: 'Payment Required',
    payment: {
      type: 'x402',
      url: paymentUrl,
      network,
    }
  })
}

// TODO: Alvaro is working on this.
function alvaroInferenceCostEstimation(): string {
  return "1";
}

// Main route handler - handles authentication, escrow, and business logic
app.all('*', async (req: EscrowRequest, res: Response, next: NextFunction) => {
  try {
    const headers = req.headers as Record<string, string>;

    if (!isApiRequest(headers) && !isX402Request(headers)) {
      return buildX402Response(res, alvaroInferenceCostEstimation(), Network.BASE);
    }

    if (isX402Request(headers)) {
    }

    // check if request is a PAYMENT HEADER
    // post the tx on-chain with the full amount
    // const result = await cdp.evm.sendUserOperation({
    // function transferWithAuthorization(

    // Step 1: Authentication
    const { processedHeaders, echoControlService } = await authenticateRequest(
      req.headers as Record<string, string>,
      prisma
    );

    const balanceCheckResult = await checkBalance(echoControlService);

    // Step 2: Set up escrow context and apply escrow middleware logic
    transactionEscrowMiddleware.setupEscrowContext(
      req,
      echoControlService.getUserId()!,
      echoControlService.getEchoAppId()!,
      balanceCheckResult.effectiveBalance ?? 0
    );

    // Apply escrow middleware logic inline
    await transactionEscrowMiddleware.handleInFlightRequestIncrement(req, res);

    // first settle with full amount (alvaro functions)
    // signature of client

    // Step 3: Execute business logic
    const { transaction, isStream, data } =
      await modelRequestService.executeModelRequest(
        req,
        res,
        processedHeaders,
        echoControlService
      );
    
    const inferenceCost = transaction.rawTransactionCost;

    // 
    // TODO: does another settle, funds go from server -> client // 3009 transferWithAuth
    // refund
    // const result = await cdp.evm.sendUserOperation({
    // TODO: this should call the facilitator
    //   async signTransaction(options: SignTransactionOptions): Promise<SignatureResult> {
    // sign Transaction and send to facilitator
    // faciitator client with setttle settle

    await echoControlService.createTransaction(transaction);
    modelRequestService.handleResolveResponse(res, isStream, data);
  } catch (error) {
    return next(error);
  }
});

function buildX402Challenge(params: X402ChallengeParams): string {
  const esc = (value: string) => value.replace(/"/g, '\\"');
  return `X-402 realm=${esc(params.realm)}", link="${esc(params.link)}", network="${esc(params.network)}"`
}

// Error handling middleware
app.use((error: Error, req: Request, res: Response) => {
  logger.error(
    `Error handling request: ${error.message} | Stack: ${error.stack}`
  );

  // if (error instanceof PaymentRequiredError) {
  //   // TODO: hardcoded amount for now, we need to determine how much 
  //   // `executeModelRequest` is going to cost before executing it.
  //   // Alvaro is working on this.
  //   const amount = '1'; 

  //   const network = Network.BASE;
  //   const paymentUrl = `${process.env.ECHO_ROUTER_BASE_URL}/api/v1/${network}/payment-link?amount=${encodeURIComponent(amount)}`;

  //   res.setHeader(
  //     'WWW-Authenticate',
  //     buildX402Challenge({
  //       realm: 'echo',
  //       link: paymentUrl,
  //       network,
  //     })
  //   )

  //   return res.status(402).json({
  //     error: 'Payment Required',
  //     payment: {
  //       type: 'x402',
  //       url: paymentUrl,
  //       network,
  //     }
  //   })
  // }

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

  return res.status(500).json({
    erorr: 'Internal Server Error',
  })
});

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  // Stop the escrow cleanup process
  transactionEscrowMiddleware.stopCleanupProcess();

  // Close database connections
  prisma
    .$disconnect()
    .then(() => {
      logger.info('Database connections closed');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    });
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Only start the server if this file is being run directly
if (require.main === module) {
  app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });
}

export default app;
