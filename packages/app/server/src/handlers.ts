import { FacilitatorClient } from 'facilitatorClient';
import { TransactionEscrowMiddleware } from 'middleware/transaction-escrow-middleware';
import { modelRequestService } from 'services/ModelRequestService';
import { HandlerInput, X402Version, Network } from 'types';
import {
  parseX402Headers,
  usdcBigIntToDecimal,
  decimalToUsdcBigInt,
  buildX402Response,
  getSmartAccount,
} from 'utils';
import { settleWithAuthorization } from 'transferWithAuth';
import { checkBalance } from 'services/BalanceCheckService';
import { prisma } from 'server';
import { makeProxyPassthroughRequest } from 'services/ProxyPassthroughService';
import { paymentMiddleware } from 'x402-express';
import { facilitator } from '@coinbase/x402';
import { USDC_ADDRESS } from 'services/fund-repo/constants';

export async function handleX402Request({
  req,
  res,
  processedHeaders,
  echoControlService,
  maxCost,
  isPassthroughProxyRoute,
  providerId,
  provider,
  isStream,
}: HandlerInput) {
  console.log('\n🎯 [HANDLER] X402 Request Handler Started');
  console.log('📦 [HANDLER] Request details:');
  console.log('  - Method:', req.method);
  console.log('  - Path:', req.path);
  console.log('  - URL:', req.url);
  
  console.log('\n📋 [HANDLER] Processed Headers:');
  console.log('  - Keys:', Object.keys(processedHeaders));
  console.log('  - Has x-payment:', 'x-payment' in processedHeaders);
  console.log('  - x-payment value:', processedHeaders['x-payment']);
  
  console.log('\n📋 [HANDLER] Raw Request Headers:');
  console.log('  - Has x-payment:', 'x-payment' in req.headers);
  console.log('  - x-payment value:', req.headers['x-payment']);
  
  console.log('\n📦 [HANDLER] Request Body BEFORE middleware:');
  console.log('  - Body:', JSON.stringify(req.body, null, 2));

  // Apply x402 payment middleware with the calculated maxCost
  const network = process.env.NETWORK as Network;
  const recipient = (await getSmartAccount()).smartAccount.address;
  
  // Convert maxCost (Decimal) to USDC bigint string for payment middleware
  const maxCostUsdcBigInt = decimalToUsdcBigInt(maxCost);

  console.log('\n🔍 [DEBUG] Request URL details:');
  console.log('  - req.originalUrl:', req.originalUrl);
  console.log('  - req.baseUrl:', req.baseUrl);
  console.log('  - req.path:', req.path);
  console.log('  - req.url:', req.url);
  console.log('  - req.hostname:', req.hostname);
  console.log('  - req.headers.host:', req.headers.host);
  console.log('  - Full URL would be:', `http://${req.headers.host}${req.originalUrl || req.url}`);

//   const routeKey = `http://${req.headers.host}${req.url}`;
  const routeKey = `${req.method.toUpperCase()} ${req.path}`;
//   const routeKey = `http://${req.headers.host}${req.url}`;
  console.log('\n⚙️ [HANDLER] Middleware Config:');
  console.log('  - Route key:', routeKey);
  console.log('  - Recipient:', recipient);
  console.log('  - Amount:', maxCostUsdcBigInt.toString());
  console.log('  - Network:', network);
  console.log('  - Asset:', USDC_ADDRESS);
  
  const x402Middleware = paymentMiddleware(
    recipient,
    {
      [routeKey]: {
        price: {
          amount: Number(maxCostUsdcBigInt).toString(),
          asset: {
            address: USDC_ADDRESS,
            decimals: 6,
            eip712: { name: 'USD Coin', version: '2'}
          },
        },
        network,
        config: {
          description: 'Echo x402',
          mimeType: 'application/json',
          maxTimeoutSeconds: 1000,
          discoverable: true,
        }
      }
    },
    facilitator,
  );
  // Execute the middleware - DON'T wrap in Promise, put logic in callback
  console.log('\n🔐 [HANDLER] Executing x402 middleware...');
  
  // ✅ Call middleware with callback containing all handler logic
  return new Promise((resolve, reject) => {
    x402Middleware(req, res, async (err: any) => {
      if (err) {
        console.error('❌ [HANDLER] X402 Middleware Error:', err);
        console.error('  - Error message:', err.message);
        console.error('  - Error stack:', err.stack);
        return reject(err);
      }
      
      try {
        console.log('✅ [HANDLER] X402 Middleware: Payment validated successfully');
        
        console.log('\n📊 [HANDLER] Processing payment data...');
        
        // Decode the x-payment header to get payment details
        const xPaymentHeader = processedHeaders['x-payment'] || req.headers['x-payment'];
        if (!xPaymentHeader) {
          throw new Error('x-payment header missing after validation');
        }
        
        const xPaymentData = JSON.parse(Buffer.from(xPaymentHeader as string, 'base64').toString());
        console.log('  - Decoded x-payment data:', JSON.stringify(xPaymentData, null, 2));
        
        // ✅ Extract payload from decoded x-payment data
        const payload = {
          from: xPaymentData.payload.authorization.from as `0x${string}`,
          to: xPaymentData.payload.authorization.to as `0x${string}`,
          value: xPaymentData.payload.authorization.value,
          valid_after: Number(xPaymentData.payload.authorization.validAfter),
          valid_before: Number(xPaymentData.payload.authorization.validBefore),
          nonce: xPaymentData.payload.authorization.nonce as `0x${string}`,
        };
        console.log('  - Parsed payload:', payload);
        
        const paymentAmount = usdcBigIntToDecimal(
          xPaymentData.payload.authorization.value
        );
        
        console.log('💰 [HANDLER] Payment amount from x-payment:', paymentAmount.toString());
        console.log('💰 [HANDLER] Expected maxCost:', maxCost.toString());
        
        if (paymentAmount.lessThan(maxCost)) {
          console.warn('⚠️ [HANDLER] Payment amount less than maxCost, returning 402');
          buildX402Response(req, res, maxCost);
          return resolve(undefined);
        }

        console.log('\n🚀 [HANDLER] Proceeding with model request...');

        if (isPassthroughProxyRoute && providerId) {
          const result = await makeProxyPassthroughRequest(
            req,
            res,
            provider,
            processedHeaders,
            providerId
          );
          return resolve(result);
        }

        const { transaction, data } = await modelRequestService.executeModelRequest(
          req,
          res,
          processedHeaders,
          provider,
          isStream
        );

        // Send the response - the middleware has intercepted res.end()/res.json()
        // and will actually send it after settlement completes
        modelRequestService.handleResolveResponse(res, isStream, data);

        // The middleware will handle settlement automatically
        const result = {
          transaction,
          isStream,
          data,
        };

        resolve(result);
      } catch (error) {
        console.error('❌ [HANDLER] Error in x402 handler:', error);
        reject(error);
      }
    });
  });
}

export async function handleApiKeyRequest({
  req,
  res,
  processedHeaders,
  echoControlService,
  maxCost,
  isPassthroughProxyRoute,
  providerId,
  provider,
  isStream,
}: HandlerInput) {
  const transactionEscrowMiddleware = new TransactionEscrowMiddleware(prisma);
  const balanceCheckResult = await checkBalance(echoControlService);

  // Step 2: Set up escrow context and apply escrow middleware logic
  transactionEscrowMiddleware.setupEscrowContext(
    req,
    echoControlService.getUserId()!,
    echoControlService.getEchoAppId()!,
    balanceCheckResult.effectiveBalance ?? 0
  );

  await transactionEscrowMiddleware.handleInFlightRequestIncrement(req, res);

  if (isPassthroughProxyRoute && providerId) {
    return await makeProxyPassthroughRequest(
      req,
      res,
      provider,
      processedHeaders,
      providerId
    );
  }

  // Step 3: Execute business logic
  const { transaction, data } = await modelRequestService.executeModelRequest(
    req,
    res,
    processedHeaders,
    provider,
    isStream
  );

  

  modelRequestService.handleResolveResponse(res, isStream, data);

  await echoControlService.createTransaction(transaction, maxCost);
}