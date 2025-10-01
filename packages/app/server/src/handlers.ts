import { TransactionEscrowMiddleware } from 'middleware/transaction-escrow-middleware';
import { modelRequestService } from 'services/ModelRequestService';
import { HandlerInput, Network, X402HandlerInput } from 'types';
import {
  usdcBigIntToDecimal,
  decimalToUsdcBigInt,
  buildX402Response,
  getSmartAccount,
  calculateRefundAmount,
  validateXPaymentHeader,
} from 'utils';
import { transfer } from 'transferWithAuth';
import { checkBalance } from 'services/BalanceCheckService';
import { prisma } from 'server';
import { makeProxyPassthroughRequest } from 'services/ProxyPassthroughService';
import { paymentMiddleware } from 'x402-express';
import { facilitator } from '@coinbase/x402';
import { USDC_ADDRESS } from 'services/fund-repo/constants';
import { DOMAIN_NAME, DOMAIN_VERSION, ECHO_DESCRIPTION, MAX_TIMEOUT_SECONDS, DISCOVERABLE, MIME_TYPE } from './constants';

export async function handleX402Request({
  req,
  res,
  processedHeaders,
  maxCost,
  isPassthroughProxyRoute,
  provider,
  isStream,
}: X402HandlerInput) {
  // Apply x402 payment middleware with the calculated maxCost
  const network = process.env.NETWORK as Network;
  const recipient = (await getSmartAccount()).smartAccount.address;

  const xPaymentData = validateXPaymentHeader(processedHeaders, req);

  const paymentAmount = xPaymentData.payload.authorization.value;
  const paymentAmountDecimal = usdcBigIntToDecimal(paymentAmount);

  // Note(shafu, alvaro): Edge case where client sends the x402-challenge
  // but the payment amount is less than what we returned in the first response
  if (BigInt(paymentAmount) < decimalToUsdcBigInt(maxCost)) {
    return buildX402Response(req, res, maxCost);
  }

  const routeKey = `${req.method.toUpperCase()} ${req.path}`;

  const x402Middleware = paymentMiddleware(
    recipient,
    {
      [routeKey]: {
        price: {
          amount: Number(paymentAmount).toString(),
          asset: {
            address: USDC_ADDRESS,
            decimals: 6,
            eip712: { name: DOMAIN_NAME, version: DOMAIN_VERSION },
          },
        },
        network,
        config: {
          description: ECHO_DESCRIPTION,
          mimeType: MIME_TYPE,
          maxTimeoutSeconds: MAX_TIMEOUT_SECONDS,
          discoverable: DISCOVERABLE,
        },
      },
    },
    facilitator
  );

  return new Promise((resolve, reject) => {
    x402Middleware(req, res, async (err: any) => {
      if (err) {
        return reject(err);
      }

      try {
        if (isPassthroughProxyRoute) {
          const result = await makeProxyPassthroughRequest(
            req,
            res,
            provider,
            processedHeaders,
          );
          return resolve(result);
        }
        const to = xPaymentData.payload.authorization.from as `0x${string}`;

        try {
          const transactionResult =
            await modelRequestService.executeModelRequest(
              req,
              res,
              processedHeaders,
              provider,
              isStream
            );
          const transaction = transactionResult.transaction;
          const data = transactionResult.data;

          const refundAmount = calculateRefundAmount(
            paymentAmountDecimal,
            transaction.rawTransactionCost
          );

          if (refundAmount.greaterThan(0)) {
            await transfer(to, decimalToUsdcBigInt(refundAmount));
          }

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
          // full refund on error
          await transfer(to, decimalToUsdcBigInt(paymentAmountDecimal));
          reject(error);
        }
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

  if (isPassthroughProxyRoute) {
    return await makeProxyPassthroughRequest(
      req,
      res,
      provider,
      processedHeaders,
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
