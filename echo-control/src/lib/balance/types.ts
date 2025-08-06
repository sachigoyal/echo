export interface BalanceResult {
  balance: number;
  totalPaid: number;
  totalSpent: number;
  currency: string;
  echoAppId: string | null;
  echoAppName: string | null;
}

export interface Balance {
  totalPaid: number;
  totalSpent: number;
  balance: number;
}
