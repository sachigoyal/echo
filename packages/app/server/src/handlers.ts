import { TransactionEscrowMiddleware } from 'middleware/transaction-escrow-middleware';
import { modelRequestService } from 'services/ModelRequestService';
import { HandlerInput, Network, Transaction, X402HandlerInput } from 'types';
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
import { USDC_ADDRESS } from 'services/fund-repo/constants';
import { FacilitatorClient } from 'services/facilitator/facilitatorService';
import {
  PaymentPayloadSchema,
  PaymentRequirementsSchema,
  SettleRequestSchema,
} from 'services/facilitator/x402-types';
import { Decimal } from '@prisma/client/runtime/library';

export async function handleX402Request({
  req,
  res,
  processedHeaders,
  maxCost,
  isPassthroughProxyRoute,
  provider,
  isStream,
}: X402HandlerInput) {

  if (isPassthroughProxyRoute) {
    return await makeProxyPassthroughRequest(
      req,
      res,
      provider,
      processedHeaders,
    );
  }
  // Apply x402 payment middleware with the calculated maxCost
  const network = process.env.NETWORK as Network;
  const recipient = (await getSmartAccount()).smartAccount.address;

  const xPaymentData = validateXPaymentHeader(processedHeaders, req);

  // Construct and validate PaymentPayload using Zod schema
  const paymentPayload = PaymentPayloadSchema.parse({
    x402Version: 1,
    scheme: 'exact',
    network: xPaymentData.network,
    payload: {
      signature: xPaymentData.payload.signature,
      authorization: {
        from: xPaymentData.payload.authorization.from,
        to: xPaymentData.payload.authorization.to,
        value: xPaymentData.payload.authorization.value,
        validAfter: xPaymentData.payload.authorization.valid_after,
        validBefore: xPaymentData.payload.authorization.valid_before,
        nonce: xPaymentData.payload.authorization.nonce,
      },
    },
  });

  const paymentAmount = (paymentPayload.payload as any).authorization.value;
  const paymentAmountDecimal = usdcBigIntToDecimal(paymentAmount);

  // Note(shafu, alvaro): Edge case where client sends the x402-challenge
  // but the payment amount is less than what we returned in the first response
  if (BigInt(paymentAmount) < decimalToUsdcBigInt(maxCost)) {
    return buildX402Response(req, res, maxCost);
  }

  const facilitatorClient = new FacilitatorClient();
  try {
  // Default to no refund
  let refundAmount = new Decimal(0);
  let transaction: Transaction | null = null;
  let data: unknown = null;

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
      await transfer(
          authPayload.authorization.from as `0x${string}`,
          refundAmountUsdcBigInt
      );
    }

  } catch (error) {
    // In case of error, do full refund
    refundAmount = paymentAmountDecimal;

    if (!refundAmount.equals(0) && refundAmount.greaterThan(0)) {
      const refundAmountUsdcBigInt = decimalToUsdcBigInt(refundAmount);
      const authPayload = paymentPayload.payload as any;
      await transfer(
          authPayload.authorization.from as `0x${string}`,
          refundAmountUsdcBigInt
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
      processedHeaders
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
