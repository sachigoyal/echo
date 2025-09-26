import { FacilitatorClient } from "facilitatorClient";
import { TransactionEscrowMiddleware } from "middleware/transaction-escrow-middleware";
import { modelRequestService } from "services/ModelRequestService";
import { HandlerInput, X402Version } from "types";
import { parseX402Headers } from "utils";
import { settleWithAuthorization } from "transferWithAuth";
import { checkBalance } from "services/BalanceCheckService";
import { prisma } from "server";
import { makeProxyPassthroughRequest } from "services/ProxyPassthroughService";

export async function handleX402Request(
        {req, res, processedHeaders, echoControlService, maxCost, isPassthroughProxyRoute, providerId, provider, isStream}: HandlerInput
    ) {
    // check enough payload payment
    const facilitator = new FacilitatorClient(process.env.FACILITATOR_BASE_URL!);

    await facilitator.settle({
        x402_version: X402Version.V1,
        payment_payload: req.body.payment_payload,
        payment_requirements: req.body.payment_requirements,
    })

    if (isPassthroughProxyRoute && providerId) {
      return await makeProxyPassthroughRequest(
        req,
        res,
        provider,
        processedHeaders,
        providerId
      );
    }
    
    const { transaction, data } =
      await modelRequestService.executeModelRequest(
        req,
        res,
        processedHeaders,
        provider,
        isStream
      );

    // SHAFU: I think there needs to be some changes here.
    // modelRequestService.handleResolveResponse(res, isStream, data);

    const payload = parseX402Headers(processedHeaders)

    const inferenceCost = transaction.rawTransactionCost;
    const refundAmount = (Number(req.body.payment_payload.value) - Number(inferenceCost)).toString()
    const result = await settleWithAuthorization({...payload, value: refundAmount })

    return {transaction, isStream, data, result, refundAmount};
}

export async function handleApiKeyRequest(
    {req, res, processedHeaders, echoControlService, isPassthroughProxyRoute, providerId, provider, isStream}: HandlerInput
) {
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
    const { transaction, data } =
      await modelRequestService.executeModelRequest(
        req,
        res,
        processedHeaders,
        provider,
        isStream
      );
    
    modelRequestService.handleResolveResponse(res, isStream, data);

    await echoControlService.createTransaction(transaction);
}