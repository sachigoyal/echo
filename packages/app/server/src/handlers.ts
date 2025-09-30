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
  calculateRefundAmount,
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

  const routeKey = `${req.method.toUpperCase()} ${req.path}`;
  
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
  
  return new Promise((resolve, reject) => {
    x402Middleware(req, res, async (err: any) => {
      if (err) {
        return reject(err);
      }
      
      try {
        // Decode the x-payment header to get payment details
        const xPaymentHeader = processedHeaders['x-payment'] || req.headers['x-payment'];
        if (!xPaymentHeader) {
          throw new Error('x-payment header missing after validation');
        }
        
        const xPaymentData = JSON.parse(Buffer.from(xPaymentHeader as string, 'base64').toString());
        
        const paymentAmount = usdcBigIntToDecimal(
          xPaymentData.payload.authorization.value
        );
        
        if (paymentAmount.lessThan(maxCost)) {
          buildX402Response(req, res, maxCost);
          return resolve(undefined);
        }

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

        // Calculate refund amount
        const refundAmount = calculateRefundAmount(maxCost, transaction.rawTransactionCost);
        let refundResult = null;
        if (!refundAmount.equals(0)) {
          const refundAmountUsdcBigInt = decimalToUsdcBigInt(refundAmount);
          refundResult = await settleWithAuthorization({
            to: xPaymentData.payload.authorization.to as `0x${string}`,
            value: refundAmountUsdcBigInt.toString(),
            valid_after: xPaymentData.payload.authorization.valid_after,
            valid_before: xPaymentData.payload.authorization.valid_before,
            nonce: xPaymentData.payload.authorization.nonce as `0x${string}`,
          })
        }

        // Send the response - the middleware has intercepted res.end()/res.json()
        // and will actually send it after settlement completes
        modelRequestService.handleResolveResponse(res, isStream, data);

        // The middleware will handle settlement automatically
        const result = {
          transaction,
          isStream,
          data,
          refundResult,
        };

        resolve(result);
      } catch (error) {
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

  // There is no actual refund, this logs if we underestimate the raw cost
  calculateRefundAmount(maxCost, transaction.rawTransactionCost);

  modelRequestService.handleResolveResponse(res, isStream, data);

  await echoControlService.createTransaction(transaction, maxCost);
}