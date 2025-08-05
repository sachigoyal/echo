import { SpendPool } from '../generated/prisma';
import { PaymentRequiredError, UnauthorizedError } from '../errors/http';
import { EchoControlService } from './EchoControlService';

export interface BalanceCheckResult {
  usingFreeTier: boolean;
  freeTierSpendPool: SpendPool | null;
  balance: number | null;
}

/**
 * Check if the user has sufficient balance or free tier access
 * @throws PaymentRequiredError if user has no balance and no free tier access
 */
export async function checkBalance(
  echoControlService: EchoControlService
): Promise<boolean> {
  const userId = echoControlService.getUserId();
  const appId = echoControlService.getEchoAppId();

  if (!userId || !appId) {
    throw new UnauthorizedError('Unauthorized');
  }

  // Check for free tier access first
  const freeTierSpendPool = await echoControlService.getOrNoneFreeTierSpendPool(
    userId,
    appId
  );

  // If no free tier, check regular balance
  const balance = await echoControlService.getBalance();

  if (balance > 0 || !!freeTierSpendPool) {
    return true;
  }
  throw new PaymentRequiredError('Payment Required');
}
