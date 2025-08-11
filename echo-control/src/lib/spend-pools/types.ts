export interface CreateSpendPoolRequest {
  name: string;
  description?: string;
  totalAmount: number;
  echoAppId: string;
  defaultSpendLimit?: number;
}

export interface SpendPoolData {
  id: string;
  name: string;
  description?: string;
  totalPaid: number;
  spentAmount: number;
  remainingAmount: number;
  defaultSpendLimit?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateSpendPoolRequest {
  name?: string;
  description?: string;
  defaultSpendLimit?: number;
}

export interface UserSpendInfo {
  userId: string;
  echoAppId: string;
  spendPoolId: string | null;
  amountSpent: number;
  spendLimit: number | null;
  amountLeft: number;
}
