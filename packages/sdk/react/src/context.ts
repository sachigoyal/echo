import type {
    EchoClient,
    EchoConfig,
    FreeBalance,
} from '@merit-systems/echo-typescript-sdk';
import { User } from "oidc-client-ts";
import { EchoBalance, EchoUser } from "./types";
import { createContext } from 'react';

export interface EchoContextValue {
    // Auth & User
    rawUser: User | null | undefined;     // directly piped from oidc
    user: EchoUser | null;                // directly piped from oidc
    balance: EchoBalance | null;
    freeTierBalance: FreeBalance | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Client and auth helpers
    token: string | null;                 // null in proxy mode
    echoClient: EchoClient | null;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshBalance: () => Promise<void>;
    createPaymentLink: (
        amount: number,
        description?: string,
        successUrl?: string
    ) => Promise<string>;
    getToken: () => Promise<string | null>; // null in proxy mode
    clearAuth: () => Promise<void>;
    config: EchoConfig;

    // Insufficient funds state
    isInsufficientFunds: boolean;
    setIsInsufficientFunds: (value: boolean) => void;
}

// Separate context for refresh state to prevent unnecessary re-renders
export interface EchoRefreshContextValue {
    isRefreshing: boolean;                        // false for proxy
}

export const EchoContext = createContext<EchoContextValue | null>(null);
export const EchoRefreshContext = createContext<EchoRefreshContextValue | null>(
    null
);