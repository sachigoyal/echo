export const WALLET_CHAINS = [1, 8453, 10, 137, 42161]

export const WALLET_OPTIONAL_METHODS = [
  'eth_sendTransaction',
  'eth_signTransaction',
  'eth_sign',
  'personal_sign',
  'eth_signTypedData',
  'eth_signTypedData_v4'
]

export const AUTH_OPTIONS = [
  { value: 'echo', label: 'Echo API Key' },
  { value: 'wallet', label: 'WalletConnect' }
]
