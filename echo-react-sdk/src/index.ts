export { EchoProvider } from './components/EchoProvider';
export { EchoSignIn } from './components/EchoSignIn';
export { EchoTokenPurchase } from './components/EchoTokenPurchase';
export { Logo } from './components/Logo';

export { useEcho } from './hooks/useEcho';
// useEchoRefresh is kept internal - most apps don't need refresh state
export { useEchoClient } from './hooks/useEchoClient';
// OpenAI integration hook
export { useEchoOpenAI } from './hooks/useEchoOpenAI';

export type {
  EchoBalance,
  EchoConfig,
  EchoSignInProps,
  EchoTokenPurchaseProps,
  EchoUser,
} from './types';

// Context types are internal implementation details
// Consumers should use the hooks (useEcho, useEchoRefresh) instead
