import { ExactEvmPayloadAuthorization, Network, X402ChallengeParams } from "types";
import { Request, Response } from 'express';
import { SmartAccount } from "@coinbase/cdp-sdk/_types/client/evm/evm.types";
import { CdpClient } from "@coinbase/cdp-sdk";
import { BaseProvider } from "./providers/BaseProvider";
import { WALLET_OWNER } from "./constants";
import { WALLET_SMART_ACCOUNT } from "./constants";
import { getRequestMaxCost } from "services/PricingService";
import { Decimal } from "generated/prisma/runtime/library";

export function parseX402Headers(headers: Record<string, string>): ExactEvmPayloadAuthorization {
    return {
        from: headers['from'] as `0x${string}`,
        to: headers['to'] as `0x${string}`,
        value: headers['value'] as string,
        valid_after: Number(headers['valid_after'] as string),
        valid_before: Number(headers['valid_before'] as string),
        nonce: headers['nonce'] as `0x${string}`,
    }
}

// TODO: Alvaro is working on this.
// takes request and provider
export function alvaroInferenceCostEstimation(): string {
  return "1";
}

function buildX402Challenge(params: X402ChallengeParams): string {
  const esc = (value: string) => value.replace(/"/g, '\\"');
  return `X-402 realm=${esc(params.realm)}", link="${esc(params.link)}", network="${esc(params.network)}"`
}

export function buildX402Response(res: Response, maxCost: Decimal) {
  const network = process.env.NETWORK as Network;
  const paymentUrl = `${process.env.ECHO_ROUTER_BASE_URL}/api/v1/${network}/payment-link?amount=${encodeURIComponent(costEstimation)}`;

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

export function isApiRequest(headers: Record<string, string>): boolean {
  return headers['x-api-key'] !== undefined;
}

export function isX402Request(headers: Record<string, string>): boolean {
  return headers['x-402-challenge'] !== undefined;
}

export async function getSmartAccount(): Promise<{cdp: CdpClient, smartAccount: SmartAccount}> {
    const cdp = new CdpClient();
    const owner = await cdp.evm.getOrCreateAccount({
        name: WALLET_OWNER,
    });

    const smartAccount = await cdp.evm.getOrCreateSmartAccount({
        name: WALLET_SMART_ACCOUNT,
        owner,
    });
    return {cdp, smartAccount};
}