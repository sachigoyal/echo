import { SpendPool } from '../generated/prisma';
import { PaymentRequiredError, UnauthorizedError } from '../errors/http';
import { EchoControlService } from './EchoControlService';

export interface BalanceCheckResult {
  usingFreeTier: boolean;
  freeTierSpendPool: SpendPool | null;
  balance: number | null;
}

const MINIMUM_SPEND_AMOUNT_SAFETY_BUFFER = 0.0001;

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

  if (freeTierSpendPool) {
    return true;
  }

  // If no free tier, check regular balance
  const balance = await echoControlService.getBalance();

  if (balance > MINIMUM_SPEND_AMOUNT_SAFETY_BUFFER) {
    return true;
  }
  throw new PaymentRequiredError('Payment Required');
}
