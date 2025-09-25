import { Decimal } from '@prisma/client/runtime/library';

export interface EchoApp {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  totalTokens?: number;
  totalCost?: number;
  apiKeys?: ApiKey[];
  _count?: {
    apiKeys: number;
    llmTransactions: number;
  };
}

export interface ApiKey {
  id: string;
  key: string;
  name?: string;
  isActive: boolean;
  lastUsed?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  userId: string;
  echoAppId: string;
  echoApp?: EchoApp;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  totalPaid?: number;
  totalSpent?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Balance {
  totalPaid: number;
  totalSpent: number;
  balance: number;
}

export interface LlmTransactionMetadata {
  providerId: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  prompt?: string;
  response?: string;
  toolCost?: Decimal;
}

export interface Transaction {
  metadata: LlmTransactionMetadata;
  rawTransactionCost: Decimal;
  status: string;
}

export interface TransactionRequest extends Transaction {
  totalCost: Decimal;
  appProfit: Decimal;
  markUpProfit: Decimal;
  referralProfit: Decimal;
  userId: string;
  echoAppId: string;
  apiKeyId?: string;
  markUpId?: string;
  spendPoolId?: string;
  referralCodeId?: string;
  referrerRewardId?: string;
}

export interface ApiKeyValidationResult {
  userId: string;
  echoAppId: string;
  user: User;
  echoApp: EchoApp;
  apiKeyId?: string;
  apiKey?: ApiKey;
}

/**
 * JWT payload for Echo Access Tokens
 */
export interface EchoAccessJwtPayload {
  user_id: string;
  app_id: string;
  scope: string;
  exp: number;
  iat: number;
  jti: string;
}

export enum Network {
  BASE = 'base',
}

export interface X402ChallengeParams {
  realm: string;
  link: string;
  network: Network;
}

export interface X402PaymentBody {
  type: 'x402';
  url: string;
  network: Network;
}

export enum X402Version {
  V1 = 'V1',
}

export enum Schema {
  Exact = 'Exact',
}

export type Address = string;
export type TokenAmount = string;
export type Url = string;

export interface ExactEvmPayload {

}

export interface PaymentPayload {
  x402_version: X402Version;
  schema: Schema;
  network: Network;
  payload: ExactEvmPayload;
}

export interface PaymentRequirements {
  schema: Schema;
  network: Network;
  max_amount_required: TokenAmount;
  resource: Url;
  description: string;
  mime_type: string;
  output_schema?: unknown;
  pay_to: Address;
  max_timeout_seconds: number;
  asset: Address;
  extra?: unknown;
}

export interface VerifyResponse {
  verified: boolean;
  transaction_id?: string;

}

export interface VerifyRequest {
  x402_version: X402Version;
  payment_payload: PaymentPayload;
  payment_requirements: PaymentRequirements;
}

export type SettleRequest = VerifyRequest;
export type SettleResponse = VerifyResponse;

export interface PaymentRequiredResponse {
  error: string;
  accepts: PaymentRequirements[];
  x402_version: X402Version;
}

export interface SupportedPaymentKind {
  x402_version: X402Version;
  schema: Schema;
  network: Network;
  extra?: {fee_payer: Address};
}

export interface SupportedPaymentKindsResponse {
  kinds: SupportedPaymentKind[];
}