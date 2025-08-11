import React, { ReactNode } from 'react';
import { EchoContext, EchoContextValue } from '../components/EchoProvider';
import { EchoUser, EchoBalance } from '../types';
import { FreeBalance } from '@zdql/echo-typescript-sdk';

// Mock data for Storybook
const mockUser: EchoUser = {
  id: 'mock-user-123',
  email: 'demo@echo-systems.com',
  name: 'Demo User',
};

const mockBalance: EchoBalance = {
  totalPaid: 150,
  totalSpent: 0,
  balance: 150,
};

const mockFreeTierBalance: FreeBalance = {
  spendPoolBalance: 100,
  userSpendInfo: {
    userId: 'mock-user-123',
    echoAppId: 'mock-app-123',
    spendPoolId: 'mock-spend-pool-123',
    amountSpent: 0,
    spendLimit: 100,
    amountLeft: 100,
  },
};

// Mock context that simulates different states
const createMockContext = (
  overrides: Partial<EchoContextValue> = {}
): EchoContextValue => ({
  user: mockUser,
  balance: mockBalance,
  freeTierBalance: mockFreeTierBalance,
  isAuthenticated: true,
  isLoading: false,
  token: 'mock-token',
  error: null,
  signIn: async () => {
    console.log('Mock sign in called');
  },
  signOut: async () => {
    console.log('Mock sign out called');
  },
  refreshBalance: async () => {
    console.log('Mock refresh balance called');
  },
  createPaymentLink: async (amount: number) => {
    console.log(`Mock payment link created for ${amount} tokens`);
    return `https://checkout.stripe.com/mock-session-${amount}`;
  },
  getToken: async () => {
    console.log('Mock get token called');
    return 'mock-token';
  },
  clearAuth: async () => {
    console.log('Mock clear auth called');
  },
  ...overrides,
});

interface MockEchoProviderProps {
  children: ReactNode;
  mockState?: Partial<EchoContextValue>;
}

export function MockEchoProvider({
  children,
  mockState = {},
}: MockEchoProviderProps) {
  const contextValue = createMockContext(mockState);

  return (
    <EchoContext.Provider value={contextValue}>{children}</EchoContext.Provider>
  );
}

// Predefined mock states
export const mockStates = {
  authenticated: createMockContext({
    isAuthenticated: true,
    user: mockUser,
    balance: mockBalance,
    isLoading: false,
  }),

  unauthenticated: createMockContext({
    isAuthenticated: false,
    user: null,
    balance: null,
    isLoading: false,
  }),

  loading: createMockContext({
    isAuthenticated: false,
    user: null,
    balance: null,
    isLoading: true,
  }),

  error: createMockContext({
    isAuthenticated: false,
    user: null,
    balance: null,
    isLoading: false,
    error: 'Failed to connect to Echo server',
  }),

  lowBalance: createMockContext({
    isAuthenticated: true,
    user: mockUser,
    balance: { totalPaid: 5, totalSpent: 0, balance: 5 },
    isLoading: false,
  }),
};
