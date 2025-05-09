import { PaymentRequiredError } from '../errors/http';

export class AccountManager {
    private accounts: Map<string, number>;

    constructor() {
        this.accounts = new Map();
        this.accounts.set('user-ben-reilly', 100000);
    }

    getAccount(user: string): number {
        return this.accounts.get(user) || 0;
    }

    setAccount(user: string, amount: number): void {
        this.accounts.set(user, amount);
    }

    decrementAccount(user: string, amount: number): void {
        const currentBalance = this.accounts.get(user) || 0;
        const newBalance = currentBalance - amount;
        if (newBalance <= 0) {
            throw new PaymentRequiredError();
        }
        this.accounts.set(user, newBalance);
    }

    incrementAccount(user: string, amount: number): void {
        const currentBalance = this.accounts.get(user) || 0;
        const newBalance = currentBalance + amount;
        this.accounts.set(user, newBalance);
    }

    reset() {
        this.accounts.clear();
    }
}

// Export a singleton instance
export const accountManager = new AccountManager();