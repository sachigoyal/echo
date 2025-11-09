export { isAuthenticated } from './auth'
export { consumeStream } from './stream'
export { createThinkingSpinner } from './spinner'
export { getChainName, isSupported, CHAIN_NAMES, CHAIN_NAMES_FULL } from './chains'
export { 
  formatAddress, 
  parseCAIP10Address, 
  initializeEthereumProvider,
  clearWalletSession,
  type EthereumProviderInstance
} from './wallet'
export { createWalletSigner } from './signer'
export { createPaymentHeader, parseChainIdFromNetwork, parse402Response, type PaymentSpec, type Payment402Response } from './x402'
export {
  ErrorCode,
  AppError,
  createError,
  throwError,
  handleError,
  displayAppError,
  extractErrorMessage,
  isAppError,
  isErrorCode,
  type ErrorContext
} from './errors'
