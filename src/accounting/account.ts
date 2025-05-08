import { PaymentRequiredError } from '../errors/http';

export class AccountManager {
    private accountLookupTable: Record<string, number>;

    constructor() {
        this.accountLookupTable = {
            "user-ben-reilly": 1000,
        };
    }

    getAccount(user: string): number {
        return this.accountLookupTable[user];
    }

    decrementAccount(user: string, amount: number): void {
        this.accountLookupTable[user] -= amount;
        if (this.accountLookupTable[user] <= 0) {
            throw new PaymentRequiredError();
        }
    }

    incrementAccount(user: string, amount: number): void {
        this.accountLookupTable[user] += amount;
    }
}

// Export a singleton instance
export const accountManager = new AccountManager();