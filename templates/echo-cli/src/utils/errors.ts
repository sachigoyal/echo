import { error, warning, hint, blankLine } from '@/print'

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  WALLET_SESSION_EXPIRED = 'WALLET_SESSION_EXPIRED',
  WALLET_DISCONNECTED = 'WALLET_DISCONNECTED',
  WRONG_CHAIN = 'WRONG_CHAIN',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  API_ERROR = 'API_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CANCELLED = 'CANCELLED',
  UNKNOWN = 'UNKNOWN'
}

export interface ErrorContext {
  code: ErrorCode
  message: string
  details?: string
  originalError?: unknown
  responseBody?: string
  requiredChainId?: number
  currentChainId?: number
}

export class AppError extends Error {
  code: ErrorCode
  details?: string
  originalError?: unknown
  responseBody?: string
  requiredChainId?: number
  currentChainId?: number

  constructor(context: ErrorContext) {
    super(context.message)
    this.name = 'AppError'
    this.code = context.code
    this.details = context.details
    this.originalError = context.originalError
    this.responseBody = context.responseBody
    this.requiredChainId = context.requiredChainId
    this.currentChainId = context.currentChainId
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export function createError(context: ErrorContext): AppError {
  return new AppError(context)
}

export function throwError(context: ErrorContext): never {
  throw createError(context)
}

export function handleError(err: unknown, fallbackMessage: string = 'An error occurred'): void {
  if (err instanceof AppError) {
    displayAppError(err)
  } else if (err instanceof Error) {
    error(err.message)
  } else {
    error(fallbackMessage)
  }
}

export function displayAppError(err: AppError): void {
  blankLine()

  switch (err.code) {
    case ErrorCode.VALIDATION_ERROR:
      error('Validation Error')
      if (err.details) {
        hint(err.details)
      }
      break

    case ErrorCode.AUTHENTICATION_FAILED:
      error('Authentication Failed')
      hint(err.message)
      hint('Please check your credentials and try again')
      break

    case ErrorCode.WALLET_SESSION_EXPIRED:
      error('Wallet Session Expired')
      warning('Your WalletConnect session has expired or was disconnected')
      hint('Please reconnect your wallet: echodex login')
      break

    case ErrorCode.WALLET_DISCONNECTED:
      warning('Wallet Disconnected')
      hint('Please reconnect your wallet: echodex login')
      break

    case ErrorCode.WRONG_CHAIN:
      error('Wrong Blockchain Network')
      hint(`Your wallet is on chain ${err.currentChainId}`)
      hint(`Please switch to chain ${err.requiredChainId} in your mobile wallet`)
      break

    case ErrorCode.INSUFFICIENT_FUNDS:
      error('Insufficient Funds')
      warning('Your wallet does not have enough balance to proceed')
      if (err.details) {
        hint(err.details)
      }
      break

    case ErrorCode.PAYMENT_FAILED:
      error('Payment Processing Failed')
      hint('Please try again or check your wallet connection')
      break

    case ErrorCode.API_ERROR:
      error('API Error')
      hint(err.message)
      break

    case ErrorCode.NOT_FOUND:
      warning('Not Found')
      hint(err.message)
      break

    case ErrorCode.CANCELLED:
      warning(err.message)
      break

    default:
      error(err.message)
  }

  blankLine()
}

export function extractErrorMessage(err: unknown): string {
  if (err instanceof AppError) {
    return err.message
  }
  if (err instanceof Error) {
    return err.message
  }
  return 'Unknown error'
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError
}

export function isErrorCode(err: unknown, code: ErrorCode): boolean {
  return isAppError(err) && err.code === code
}

