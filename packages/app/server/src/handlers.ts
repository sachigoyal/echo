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
  // Apply x402 payment middleware with the calculated maxCost
  const network = process.env.NETWORK as Network;
  const recipient = (await getSmartAccount()).smartAccount.address;
  
  // Convert maxCost (Decimal) to USDC bigint string for payment middleware
  const maxCostUsdcBigInt = decimalToUsdcBigInt(maxCost);
  
  const x402Middleware = paymentMiddleware(
    recipient,
    {
      [`${req.method.toUpperCase()} ${req.path}`]: {
        price: {
          amount: maxCostUsdcBigInt.toString(),
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

  // Execute the middleware to validate payment
  await new Promise<void>((resolve, reject) => {
    x402Middleware(req, res, (err: any) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const payload = parseX402Headers(processedHeaders);

  const paymentAmount = usdcBigIntToDecimal(
    req.body.payment_payload.payload.authorization.value
  );
  if (paymentAmount.lessThan(maxCost)) {
    buildX402Response(res, maxCost);
    return;
  }

  if (isPassthroughProxyRoute && providerId) {
    return await makeProxyPassthroughRequest(
      req,
      res,
      provider,
      processedHeaders,
      providerId
    );
  }

  const { transaction, data } = await modelRequestService.executeModelRequest(
    req,
    res,
    processedHeaders,
    provider,
    isStream
  );
  modelRequestService.handleResolveResponse(res, isStream, data);

  // x402 refund logic
  const inferenceCost = transaction.rawTransactionCost;
  const refundAmountDecimal = paymentAmount.minus(inferenceCost);
  const refundAmountBigInt = decimalToUsdcBigInt(refundAmountDecimal);
  const result = await settleWithAuthorization({
    ...payload,
    value: refundAmountBigInt.toString(),
  });

  const refundResult = await settleWithAuthorization({
    ...payload,
    value: refundAmountBigInt.toString(),
  })

  return {
    transaction,
    isStream,
    data,
    result,
    refundResult,
    refundAmount: refundAmountDecimal,
  };
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
