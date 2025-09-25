import { FacilitatorClient } from "facilitatorClient";
import { EscrowRequest, TransactionEscrowMiddleware } from "middleware/transaction-escrow-middleware";
import { modelRequestService } from "services/ModelRequestService";
import { X402Version } from "types";
import { Response } from "express";
import { EchoControlService } from "services/EchoControlService";
import { parseX402Headers } from "utils";
import { transferWithAuthorization } from "transferWithAuth";
import { checkBalance } from "services/BalanceCheckService";
import { prisma } from "server";

async function handleX402Request(
        req: EscrowRequest,
        res: Response,
        processedHeaders: Record<string, string>,
        echoControlService: EchoControlService,
        estimatedCost: string,
    ) {
    const facilitator = new FacilitatorClient(process.env.FACILITATOR_BASE_URL!);
      facilitator.settle({
        x402_version: X402Version.V1,
        payment_payload: req.body.payment_payload,
        payment_requirements: req.body.payment_requirements,
      })

    const { transaction, isStream, data } =
      await modelRequestService.executeModelRequest(
        req,
        res,
        processedHeaders,
        echoControlService
      );

    const inferenceCost = transaction.rawTransactionCost;

    const payload = parseX402Headers(processedHeaders)

    const result = await transferWithAuthorization({...payload, value: (Number(estimatedCost) - Number(inferenceCost)).toString() })

    return {transaction, isStream, data, result};
}

async function handleApiKeyRequest(
    req: EscrowRequest,
    res: Response,
    processedHeaders: Record<string, string>,
    echoControlService: EchoControlService,
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

    // Step 3: Execute business logic
    const { transaction, isStream, data } =
      await modelRequestService.executeModelRequest(
        req,
        res,
        processedHeaders,
        echoControlService
      );

    await echoControlService.createTransaction(transaction);
}