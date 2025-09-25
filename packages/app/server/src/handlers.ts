import { FacilitatorClient } from "facilitatorClient";
import { EscrowRequest } from "middleware/transaction-escrow-middleware";
import { modelRequestService } from "services/ModelRequestService";
import { X402Version } from "types";
import { Response } from "express";
import { EchoControlService } from "services/EchoControlService";
import { parseX402Headers } from "utils";
import { transferWithAuthorization } from "transferWithAuth";

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