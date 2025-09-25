import { ExactEvmPayloadAuthorization, Network, X402ChallengeParams } from "types";
import { Response } from 'express';

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

export function buildX402Response(res: Response, amount: string, network: Network) {
  const paymentUrl = `${process.env.ECHO_ROUTER_BASE_URL}/api/v1/${network}/payment-link?amount=${encodeURIComponent(amount)}`;

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