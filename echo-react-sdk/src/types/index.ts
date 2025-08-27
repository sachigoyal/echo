import { Balance } from '@merit-systems/echo-typescript-sdk';

import { EchoConfig } from '@merit-systems/echo-typescript-sdk';

export interface EchoAuthConfig extends EchoConfig {
  redirectUri?: string;
  scope?: string;
}

export interface EchoUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

export type EchoBalance = Balance;

export interface EchoSignInProps {
  onSuccess?: (user: EchoUser) => void;
  onError?: (error: Error) => void;
  className?: string;
  children?: React.ReactNode;
}

export interface EchoTokenPurchaseProps {
  amount?: number;
  onPurchaseComplete?: (balance: EchoBalance) => void;
  onError?: (error: Error) => void;
  className?: string;
  children?: React.ReactNode;
}
