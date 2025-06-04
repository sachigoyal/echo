export interface EchoApp {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
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
  clerkId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LlmTransaction {
  id: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  prompt?: string;
  response?: string;
  status: string;
  errorMessage?: string;
  createdAt: string;
  userId: string;
  echoAppId?: string;
}

export interface Payment {
  id: string;
  stripePaymentId?: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  echoAppId?: string;
}

export interface Balance {
  totalCredits: number;
  totalSpent: number;
  balance: number;
  echoAppName?: string;
  echoAppId?: string;
}

export interface CreateEchoAppRequest {
  name: string;
  description?: string;
}

export interface CreateEchoAppResponse {
  echoApp: EchoApp;
}

export interface ListEchoAppsResponse {
  echoApps: EchoApp[];
}

export interface CreateApiKeyRequest {
  echoAppId: string;
  name?: string;
}

export interface CreateApiKeyResponse {
  apiKey: ApiKey;
}

export interface ListApiKeysResponse {
  apiKeys: ApiKey[];
}

export interface GetBalanceResponse {
  balance: Balance;
}

export interface CreatePaymentLinkRequest {
  amount: number;
  description?: string;
  echoAppId?: string;
}

export interface CreatePaymentLinkResponse {
  paymentLink: {
    id: string;
    url: string;
    amount: number;
    currency: string;
    description?: string;
  };
}

export interface CreateLlmTransactionRequest {
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  prompt?: string;
  response?: string;
  status?: string;
  errorMessage?: string;
}

export interface CreateLlmTransactionResponse {
  transaction: LlmTransaction;
} 