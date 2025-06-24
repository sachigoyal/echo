export interface EchoConfig {
  appId: string;
  apiUrl?: string;
  redirectUri?: string;
  scope?: string;
}

export interface EchoUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

export interface EchoBalance {
  credits: number;
  currency: string;
}

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
