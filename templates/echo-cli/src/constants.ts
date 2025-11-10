import { APP } from '@/config/app'
import { MODELS } from '@/config/models'

export { ECHODEX_ASCII_ART } from '@/config/ascii'
export { APP, APP_METADATA } from '@/config/app'
export { MODELS, DEFAULT_MODEL } from '@/config/models'
export { MESSAGE_MODES, THINKING_MESSAGES, THINKING_INTERVAL, THINKING_COLORS } from '@/config/messages'
export { WALLET_CHAINS, WALLET_OPTIONAL_METHODS, AUTH_OPTIONS } from '@/config/wallet'

export const AGENT_NAME = 'echodex' as const
export const ECHO_KEYS_URL = APP.echoKeysUrl
export const AVAILABLE_MODELS = MODELS

export const ECHO_APP_ID = 'YOUR_ECHO_APP_ID'
export const WALLETCONNECT_PROJECT_ID = 'YOUR_WALLETCONNECT_PROJECT_ID'