export { EchoProvider } from './components/EchoProvider';
export { EchoSignIn } from './components/EchoSignIn';
export { EchoSignOut } from './components/EchoSignOut';
export { EchoTokens } from './components/EchoTokens';
export { InsufficientFundsModal } from './components/InsufficientFundsModal';
export { Logo } from './components/Logo';

export { useEcho } from './hooks/useEcho';
// useEchoRefresh is kept internal - most apps don't need refresh state
export { useEchoOIDCClient as useEchoClient } from './hooks/useEchoClient'; // TODO(sragss): rename
// OpenAI integration hook
export { useEchoOpenAI } from './hooks/useEchoOpenAI';
// Echo provider hooks
export { useEchoModelProviders } from './hooks/useEchoModelProviders';
// AI SDK integration hooks
export { EchoChatProvider } from './components/EchoChatProvider';
export { EchoProxyProvider } from './EchoProxyProvider'; // TODO(sragss): rm 
export { useChat } from './hooks/useChat';

export type {
  EchoBalance,
  EchoAuthConfig as EchoConfig,
  EchoSignInProps,
  EchoSignOutProps,
  EchoTokensProps,
  EchoUser,
} from './types';

export type { EchoContextValue } from './context';
export { EchoContext, EchoRefreshContext } from './context';
