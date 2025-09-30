import {
  ExactEvmPayloadAuthorization,
  Network,
  SendUserOperationReturnType,
  X402ChallengeParams,
} from 'types';
import { Request, Response } from 'express';
import { CdpClient, EvmSmartAccount} from '@coinbase/cdp-sdk';
import { WALLET_OWNER } from './constants';
import { WALLET_SMART_ACCOUNT } from './constants';
import { Decimal } from 'generated/prisma/runtime/library';
import { USDC_ADDRESS } from 'services/fund-repo/constants';
import crypto from 'crypto';
import logger from 'logger';
import { transferWithAuthorization } from 'transferWithAuth';

/**
 * USDC has 6 decimal places
 */
const USDC_DECIMALS = 6;
const USDC_MULTIPLIER = 10 ** USDC_DECIMALS;

/**
 * Converts a decimal amount (USD) to USDC BigInt representation
 * USDC has 6 decimal places, so $1.234567 becomes 1234567n
 * @param amount Decimal amount in USD
 * @returns BigInt representation for USDC
 */
export function decimalToUsdcBigInt(amount: Decimal | number): bigint {
  const numericAmount = typeof amount === 'number' ? amount : Number(amount);
  // Use Math.ceil for defensive rounding to avoid undercharging
  return BigInt(Math.ceil(numericAmount * USDC_MULTIPLIER));
}

/**
 * Converts USDC BigInt representation to decimal amount (USD)
 * @param usdcBigInt BigInt representation of USDC amount
 * @returns Decimal amount in USD
 */
export function usdcBigIntToDecimal(usdcBigInt: bigint | string): Decimal {
  const bigIntValue =
    typeof usdcBigInt === 'string' ? BigInt(usdcBigInt) : usdcBigInt;
  const decimalValue = Number(bigIntValue) / USDC_MULTIPLIER;
  return new Decimal(decimalValue);
}

/**
 * Calculates the refund amount for an x402 request. Also used to log when we underestimate the cost.
 * @param maxCost The max cost of the request
 * @param transactionCost The cost of the transaction
 * @returns The refund amount
 */
export function calculateRefundAmount(
  maxCost: Decimal,
  transactionCost: Decimal
): Decimal {
  if (transactionCost.greaterThan(maxCost)) {
    logger.error(
      `Transaction cost (${transactionCost}) exceeds max cost (${maxCost}).`
    );
    return new Decimal(0);
  }
  return maxCost.minus(transactionCost);
}

/**
 * Generates a random nonce in hexadecimal format
 * @returns A random hex string with 0x prefix (25 bytes = 50 hex chars)
 */
export function generateRandomNonce(): `0x${string}` {
  const bytes = crypto.randomBytes(32);
  return `0x${bytes.toString('hex')}` as `0x${string}`;
}

export function parseX402Headers(
  headers: Record<string, string>
): ExactEvmPayloadAuthorization {
  return {
    from: headers['from'] as `0x${string}`,
    to: headers['to'] as `0x${string}`,
    value: headers['value'] as string,
    valid_after: Number(headers['valid_after'] as string),
    valid_before: Number(headers['valid_before'] as string),
    nonce: headers['nonce'] as `0x${string}`,
  };
}

function buildX402Challenge(params: X402ChallengeParams): string {
  const esc = (value: string) => value.replace(/"/g, '\\"');
  return `X-402 realm=${esc(params.realm)}", link="${esc(params.link)}", network="${esc(params.network)}"`;
}

export async function buildX402Response(
  req: Request,
  res: Response,
  maxCost: Decimal
) {
  const network = process.env.NETWORK as Network;
  // Convert maxCost from Decimal to USDC BigInt string for payment URL
  const maxCostBigInt = decimalToUsdcBigInt(maxCost);
  const paymentUrl = `${process.env.ECHO_ROUTER_BASE_URL}/api/v1/${network}/payment-link?amount=${encodeURIComponent(maxCostBigInt.toString())}`;

  const recipient = (await getSmartAccount()).smartAccount.address;
  const resourceUrl = `http://${req.headers.host}${req.url}`;

  res.setHeader(
    'WWW-Authenticate',
    buildX402Challenge({
      realm: 'echo',
      link: paymentUrl,
      network,
    })
  );

  const resBody = {
    x402Version: 1,
    error: 'Payment Required',
    accepts: [
      {
        type: 'x402',
        version: '1',
        network,
        maxAmountRequired: maxCostBigInt.toString(),
        recipient: recipient,
        currency: USDC_ADDRESS,
        to: recipient,
        url: paymentUrl,
        nonce: generateRandomNonce(),
        scheme: 'exact',
        resource: resourceUrl,
        description: 'Echo x402',
        mimeType: 'application/json',
        maxTimeoutSeconds: 1000,
        discoverable: true,
        payTo: recipient,
        asset: USDC_ADDRESS,
        extra: {
          name: 'USD Coin',
          version: '2',
        },
      },
    ],
  };

  console.log('resBody', resBody);

  return res.status(402).json(resBody);
}

export function isApiRequest(headers: Record<string, string>): boolean {
  return (
    headers['x-api-key'] !== undefined ||
    headers['x-google-api-key'] !== undefined ||
    headers['authorization'] !== undefined
  );
}

export function isX402Request(headers: Record<string, string>): boolean {
  return headers['x-payment'] !== undefined;
}

export async function getSmartAccount(): Promise<{
  smartAccount: EvmSmartAccount;
}> {
  const cdp = new CdpClient();
  const owner = await cdp.evm.getOrCreateAccount({
    name: WALLET_OWNER,
  });

  const smartAccount = await cdp.evm.getOrCreateSmartAccount({
    name: WALLET_SMART_ACCOUNT,
    owner,
  });

  return {smartAccount};
}

export async function refund(to: string, value: string) : Promise<SendUserOperationReturnType> {
    return await transferWithAuthorization({
        to,
        value,
        valid_after: 0,
        valid_before: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
        nonce: generateRandomNonce(),
    })
}