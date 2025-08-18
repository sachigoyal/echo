export { EchoProvider } from './components/EchoProvider';
export { EchoSignIn } from './components/EchoSignIn';
export { EchoTokenPurchase } from './components/EchoTokenPurchase';
export { Logo } from './components/Logo';

export { useEcho } from './hooks/useEcho';
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

export type { EchoContextValue } from './components/EchoProvider';
