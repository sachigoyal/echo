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
    rawUser: User | null | undefined;     // directly piped from oidc -- TODO: rm when EchoUser is sufficient.
    isLoggedIn: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    getToken: () => Promise<string | null>; // null in proxy mode
    echoClient: EchoClient | null;
    config: EchoConfig;

    isLoading: boolean;
    error: string | null;

    user: EchoUser | null;                // directly piped from oidc

    freeTierBalance: FreeBalance | null;
    balance: EchoBalance | null;
    refreshBalance: () => Promise<void>;

    createPaymentLink: (
        amount: number,
        description?: string,
        successUrl?: string
    ) => Promise<string>;

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