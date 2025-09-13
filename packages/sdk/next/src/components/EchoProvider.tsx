'use client';

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { EchoContext, EchoRefreshContext } from "@merit-systems/echo-react-sdk";
import { EchoUser } from "@merit-systems/echo-react-sdk";
import { EchoClient } from "@merit-systems/echo-typescript-sdk";

import { useEchoUser } from "../hooks/internal/useEchoUser";
import { useEchoBalance } from "../hooks/internal/useEchoBalance"; 
import { useEchoPayments } from "../hooks/internal/useEchoPayments";

export interface EchoProxyConfig {
    appId: string;
    basePath?: string;      // default '/api/echo'
    initialSession?: { isAuthenticated: boolean; user?: EchoUser | null };
}

function useProxySession(basePath: string, initial?: EchoProxyConfig['initialSession']) {
    const [state, setState] = useState<{ isAuthenticated: boolean; isLoading: boolean; error: string | null }>({
        isAuthenticated: !!initial?.isAuthenticated,
        isLoading: !initial,
        error: null,
    });

    useEffect(() => {
        if (initial) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`${basePath}/session`, { credentials: 'include' });
                if (!res.ok) throw new Error(`Session ${res.status}`);
                const json = await res.json();
                if (!cancelled) setState({ isAuthenticated: !!json.isAuthenticated, isLoading: false, error: null });
            } catch (e: any) {
                if (!cancelled) setState({ isAuthenticated: false, isLoading: false, error: e?.message ?? 'Session error' });
            }
        })();
        return () => { cancelled = true; };
    }, [basePath, initial]);

    return state;
}


interface EchoProviderProps {
    config: EchoProxyConfig;
    children: ReactNode;
}

// TODO(sragss):
// 1. Audit configs, make sure they're sensible and work across both.
// 2. What happens on sign out and shit. Are we handling that properly. Will we properly detect a sign out state?

export function EchoProvider({ config, children }: EchoProviderProps) {
    const basePath = config.basePath || '/api/echo';
    const session = useProxySession(basePath, config.initialSession);

    const echoClient = useMemo(() => new EchoClient({ baseUrl: `${basePath}/proxy`, apiKey: 'next-sdk-proxy' }), [basePath]);

    const {
        user: echoUser,
        error: userError,
        isLoading: userLoading,
        refreshUser,
    } = useEchoUser(echoClient);

    const {
        balance,
        freeTierBalance,
        refreshBalance,
        error: balanceError,
        isLoading: balanceLoading,
    } = useEchoBalance(echoClient, config.appId);

    const {
        createPaymentLink,
        error: paymentError,
        isLoading: paymentLoading,
    } = useEchoPayments(echoClient);

    const [isInsufficientFunds, setIsInsufficientFunds] = useState(false);

    const combinedError =
        session.error || balanceError || paymentError || userError || null;

    const combinedLoading = session.isLoading || balanceLoading || paymentLoading || userLoading;

    const signIn = useCallback(async () => {
        const returnTo = typeof window !== 'undefined' ? window.location.href : undefined;
        const url = `${basePath}/signin${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`;
        window.location.href = url;
    }, [basePath]);

    const signOut = useCallback(async () => {
        window.location.href = `${basePath}/signout`;
    }, [basePath]);

    const clearAuth = useCallback(async () => {
        await fetch(`${basePath}/signout`, { method: 'POST', credentials: 'include' });
        if (typeof window !== 'undefined') window.location.reload();
    }, [basePath]);

    const getToken = useCallback(async () => null, []);

    const contextValue = useMemo(() => ({
        user: echoUser,
        rawUser: null,
        balance,
        freeTierBalance,
        isAuthenticated: session.isAuthenticated,
        isLoading: combinedLoading,
        error: combinedError,

        token: null,
        echoClient,
        signIn,
        signOut,
        refreshBalance,
        createPaymentLink,
        getToken,
        clearAuth,
        config: { appId: config.appId } as any,

        isInsufficientFunds,
        setIsInsufficientFunds,
    }), [
        echoUser, 
        balance, 
        freeTierBalance, 
        session.isAuthenticated, 
        combinedLoading, 
        combinedError, 
        echoClient, 
        signIn, 
        signOut, 
        refreshBalance, 
        createPaymentLink, 
        getToken, 
        clearAuth, 
        config.appId,
        isInsufficientFunds, 
        setIsInsufficientFunds
    ]);

    // TODO(sragss): Is there a refresh equivalent?
    const refreshContextValue = useMemo(() => ({ isRefreshing: false }), []);
    return (
        <EchoContext.Provider value={contextValue}>
            <EchoRefreshContext.Provider value={refreshContextValue}>
                {children}
            </EchoRefreshContext.Provider>
        </EchoContext.Provider>
    );
}