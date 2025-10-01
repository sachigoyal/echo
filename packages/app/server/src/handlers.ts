import { TransactionEscrowMiddleware } from 'middleware/transaction-escrow-middleware';
import { modelRequestService } from 'services/ModelRequestService';
import { HandlerInput, Network, X402HandlerInput } from 'types';
import {
  usdcBigIntToDecimal,
  decimalToUsdcBigInt,
  buildX402Response,
  getSmartAccount,
  calculateRefundAmount,
} from 'utils';
import { Decimal } from '@prisma/client/runtime/library';
import { transfer } from 'transferWithAuth';
import { checkBalance } from 'services/BalanceCheckService';
import { prisma } from 'server';
import { makeProxyPassthroughRequest } from 'services/ProxyPassthroughService';
import { USDC_ADDRESS } from 'services/fund-repo/constants';
import { FacilitatorClient } from 'services/facilitator/facilitatorService';
import {
  PaymentPayloadSchema,
  PaymentRequirementsSchema,
  VerifyRequestSchema,
  SettleRequestSchema,
} from 'services/facilitator/x402-types';

export async function handleX402Request({
  req,
  res,
  processedHeaders,
  maxCost,
  isPassthroughProxyRoute,
  providerId,
  provider,
  isStream,
}: X402HandlerInput) {
  // Apply x402 payment middleware with the calculated maxCost
  const network = process.env.NETWORK as Network;
  const recipient = (await getSmartAccount()).smartAccount.address;

  // Convert maxCost (Decimal) to USDC bigint string for payment middleware
  const maxCostUsdcBigInt = decimalToUsdcBigInt(maxCost);

  // Decode the x-payment header to get payment details
  const xPaymentHeader =
    processedHeaders['x-payment'] || req.headers['x-payment'];
  if (!xPaymentHeader) {
    throw new Error('x-payment header missing after validation');
  }

  const xPaymentDataRaw = JSON.parse(
    Buffer.from(xPaymentHeader as string, 'base64').toString()
  );

  // Construct and validate PaymentPayload using Zod schema
  const paymentPayload = PaymentPayloadSchema.parse({
    x402Version: 1,
    scheme: 'exact',
    network: xPaymentDataRaw.network,
    payload: {
      signature: xPaymentDataRaw.payload.signature,
      authorization: {
        from: xPaymentDataRaw.payload.authorization.from,
        to: xPaymentDataRaw.payload.authorization.to,
        value: xPaymentDataRaw.payload.authorization.value,
        validAfter: xPaymentDataRaw.payload.authorization.validAfter,
        validBefore: xPaymentDataRaw.payload.authorization.validBefore,
        nonce: xPaymentDataRaw.payload.authorization.nonce,
      },
    },
  });

  const paymentAmount = (paymentPayload.payload as any).authorization.value;
  const paymentAmountDecimal = usdcBigIntToDecimal(paymentAmount);

  if (paymentAmount < maxCostUsdcBigInt) {
    buildX402Response(req, res, maxCost);
  }

  const facilitatorClient = new FacilitatorClient();
  try {
    if (isPassthroughProxyRoute && providerId) {
      return await makeProxyPassthroughRequest(
        req,
        res,
        provider,
        processedHeaders,
        providerId
      );
    }
  // Default to no refund
  let refundAmount = new Decimal(0);
  let transaction,
    data,
    refundResult = null;

  // Construct and validate PaymentRequirements using Zod schema
  const paymentRequirements = PaymentRequirementsSchema.parse({
    scheme: 'exact',
    network,
    maxAmountRequired: paymentAmount,
    resource: `${req.protocol}://${req.get('host')}${req.url}`,
    description: 'Echo x402',
    mimeType: 'application/json',
    payTo: recipient,
    maxTimeoutSeconds: 60,
    asset: USDC_ADDRESS,
    extra: {
      name: 'USD Coin',
      version: '2',
    },
  });
  // Validate and execute settle request
  const settleRequest = SettleRequestSchema.parse({
    paymentPayload,
    paymentRequirements,
  });

  const settleResult = await facilitatorClient.settle(settleRequest);

  if (!settleResult.success || !settleResult.transaction) {
    return buildX402Response(req, res, maxCost);
  }

  try {
    const transactionResult =
      await modelRequestService.executeModelRequest(
        req,
        res,
        processedHeaders,
        provider,
        isStream
      );
    transaction = transactionResult.transaction;
    data = transactionResult.data;

    // Send the response - the middleware has intercepted res.end()/res.json()
    // and will actually send it after settlement completes
    modelRequestService.handleResolveResponse(res, isStream, data);

    refundAmount = calculateRefundAmount(
      paymentAmountDecimal,
      transaction.rawTransactionCost
    );

    // Process refund if needed
    if (!refundAmount.equals(0) && refundAmount.greaterThan(0)) {
      const refundAmountUsdcBigInt = decimalToUsdcBigInt(refundAmount);
      const authPayload = paymentPayload.payload as any;
      refundResult = await transfer(
          authPayload.authorization.from as `0x${string}`,
          refundAmountUsdcBigInt.toString()
      );
    }

  } catch (error) {
    // In case of error, do full refund
    refundAmount = paymentAmountDecimal;

    if (!refundAmount.equals(0) && refundAmount.greaterThan(0)) {
      const refundAmountUsdcBigInt = decimalToUsdcBigInt(refundAmount);
      const authPayload = paymentPayload.payload as any;
      refundResult = await transfer(
          authPayload.authorization.from as `0x${string}`,
          refundAmountUsdcBigInt.toString()
      );
    }
  }
  } catch (error) {
    throw error;
  }
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
