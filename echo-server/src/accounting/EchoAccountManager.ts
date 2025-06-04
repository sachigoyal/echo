import { echoControlService, AuthenticationResult, CreateTransactionRequest } from '../services/EchoControlService';

export class EchoAccountManager {
  /**
   * Get balance for an authenticated user/app
   */
  async getAccount(authResult: AuthenticationResult, apiKey: string): Promise<number> {
    return await echoControlService.getBalance(apiKey);
  }

  /**
   * Decrement account balance by creating a transaction
   */
  async decrementAccount(
    authResult: AuthenticationResult, 
    apiKey: string, 
    amount: number, 
    transactionDetails: Omit<CreateTransactionRequest, 'cost' | 'userId' | 'echoAppId'>
  ): Promise<void> {
    const transaction: CreateTransactionRequest = {
      ...transactionDetails,
      cost: amount,
      userId: authResult.userId,
      echoAppId: authResult.echoAppId
    };

    await echoControlService.createTransaction(apiKey, transaction);
  }
}

// Export singleton instance
export const echoAccountManager = new EchoAccountManager(); 