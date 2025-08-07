import { Decimal } from '@prisma/client/runtime/library';
import { Transaction as PrismaTransaction } from '@/generated/prisma';

/**
 * Serialized version of Transaction with Decimal values converted to numbers
 */
export type SerializedTransaction = Omit<PrismaTransaction, 'cost'> & {
  cost: number;
};

/**
 * Convert a Prisma Transaction to a serializable format
 * Converts Decimal values to numbers for Client Component compatibility
 */
export function serializeTransaction(
  transaction: PrismaTransaction
): SerializedTransaction {
  return {
    ...transaction,
    cost: Number(transaction.cost),
  };
}

/**
 * Convert multiple transactions to serializable format
 */
export function serializeTransactions(
  transactions: PrismaTransaction[]
): SerializedTransaction[] {
  return transactions.map(serializeTransaction);
}

/**
 * Generic function to convert any Decimal value to number
 */
export function decimalToNumber(
  value: Decimal | number | null | undefined
): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === 'number') {
    return value;
  }
  return Number(value);
}
