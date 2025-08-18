/**
 * Comprehensive error handling utilities for Echo TypeScript SDK
 */

import { AxiosError, AxiosInstance, AxiosResponse } from 'axios';

// Base Echo error class that extends Error for backward compatibility
export class EchoError extends Error {
  public readonly code: string;
  public readonly details?: string;
  public readonly statusCode?: number;
  public readonly endpoint?: string;
  public readonly originalError?: Error;

  constructor(
    code: string,
    message: string,
    options?: {
      details?: string;
      statusCode?: number;
      endpoint?: string;
      originalError?: Error;
    }
  ) {
    super(message);
    this.name = 'EchoError';
    this.code = code;
    if (options?.details !== undefined) this.details = options.details;
    if (options?.statusCode !== undefined) this.statusCode = options.statusCode;
    if (options?.endpoint !== undefined) this.endpoint = options.endpoint;
    if (options?.originalError !== undefined)
      this.originalError = options.originalError;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EchoError);
    }
  }
}

// Specific error subclasses for different error types
export class EchoApiError extends EchoError {
  constructor(
    code: string,
    message: string,
    statusCode?: number,
    details?: string,
    endpoint?: string
  ) {
    const options: {
      details?: string;
      statusCode?: number;
      endpoint?: string;
    } = {};
    if (details !== undefined) options.details = details;
    if (statusCode !== undefined) options.statusCode = statusCode;
    if (endpoint !== undefined) options.endpoint = endpoint;

    super(code, message, options);
    this.name = 'EchoApiError';
  }
}

export class EchoNetworkError extends EchoError {
  constructor(message: string, originalError: Error, endpoint?: string) {
    const options: { originalError: Error; endpoint?: string } = {
      originalError,
    };
    if (endpoint !== undefined) options.endpoint = endpoint;

    super('NETWORK_ERROR', message, options);
    this.name = 'EchoNetworkError';
  }
}

export class EchoTimeoutError extends EchoError {
  public readonly timeout: number;

  constructor(message: string, timeout: number, endpoint?: string) {
    const options: { endpoint?: string } = {};
    if (endpoint !== undefined) options.endpoint = endpoint;

    super('TIMEOUT_ERROR', message, options);
    this.name = 'EchoTimeoutError';
    this.timeout = timeout;
  }
}

export class EchoAuthError extends EchoError {
  constructor(message: string, details?: string, endpoint?: string) {
    const options: { details?: string; endpoint?: string } = {};
    if (details !== undefined) options.details = details;
    if (endpoint !== undefined) options.endpoint = endpoint;

    super('AUTH_ERROR', message, options);
    this.name = 'EchoAuthError';
  }
}

// Error codes that should trigger specific actions
export const ERROR_CODES = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',

  // API errors
  BAD_REQUEST: 'BAD_REQUEST',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',

  // Server errors
  SERVER_ERROR: 'SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

/**
 * Parse and standardize errors from various sources
 */
export function parseEchoError(
  error: unknown,
  context?: string,
  endpoint?: string
): EchoError {
  // Handle Axios errors (most common)
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError;

    // Network/timeout errors
    if (axiosError.code === 'ECONNABORTED') {
      return new EchoTimeoutError(
        `Request timeout${context ? ` while ${context}` : ''}`,
        30000, // Default timeout
        endpoint
      );
    }

    if (!axiosError.response) {
      return new EchoNetworkError(
        `Network error${context ? ` while ${context}` : ''}`,
        axiosError,
        endpoint
      );
    }

    // API errors with response
    const status = axiosError.response.status;
    const responseData = axiosError.response.data as Record<string, unknown>;

    let code: string;
    let message: string;

    // Extract the base error message from response
    const baseErrorMessage =
      (responseData?.error as string) || (responseData?.message as string);

    switch (status) {
      case 401:
        code = ERROR_CODES.UNAUTHORIZED;
        message =
          baseErrorMessage || 'Authentication required. Please sign in again.';
        break;
      case 403:
        code = ERROR_CODES.INVALID_TOKEN;
        message =
          baseErrorMessage || 'Access denied. Your session may have expired.';
        break;
      case 404:
        code = ERROR_CODES.NOT_FOUND;
        message = baseErrorMessage || 'Resource not found';
        break;
      case 429:
        code = ERROR_CODES.RATE_LIMITED;
        message =
          baseErrorMessage || 'Too many requests. Please try again later.';
        break;
      case 400:
        code = ERROR_CODES.BAD_REQUEST;
        message = baseErrorMessage || 'Invalid request';
        break;
      case 402:
        code = ERROR_CODES.INSUFFICIENT_BALANCE;
        message =
          baseErrorMessage ||
          'Insufficient balance. Please add credits to continue.';
        break;
      case 422:
        code = ERROR_CODES.VALIDATION_ERROR;
        message = baseErrorMessage || 'Validation failed';
        break;
      case 503:
        code = ERROR_CODES.SERVICE_UNAVAILABLE;
        message =
          baseErrorMessage ||
          'Service temporarily unavailable. Please try again.';
        break;
      default:
        code = ERROR_CODES.SERVER_ERROR;
        message = baseErrorMessage || 'An unexpected error occurred';
    }

    // Format message to match test expectations: "Failed to {context}: {error}"
    const formattedMessage = context
      ? `Failed to ${context}: ${message}`
      : message;

    return new EchoApiError(
      code,
      formattedMessage,
      status,
      (responseData?.details as string) ||
        (responseData?.error_description as string),
      endpoint
    );
  }

  // Handle standard JavaScript errors
  if (error instanceof Error) {
    return new EchoNetworkError(
      error.message || `Unknown error${context ? ` while ${context}` : ''}`,
      error,
      endpoint
    );
  }

  // Handle string errors
  if (typeof error === 'string') {
    return new EchoApiError(
      ERROR_CODES.SERVER_ERROR,
      error,
      undefined,
      undefined,
      endpoint
    );
  }

  // Fallback for unknown error types
  return new EchoApiError(
    ERROR_CODES.SERVER_ERROR,
    `Unknown error${context ? ` while ${context}` : ''}`,
    undefined,
    String(error),
    endpoint
  );
}

/**
 * Check if an error should trigger authentication flow
 */
export function isAuthError(error: EchoError): boolean {
  const authCodes = [
    ERROR_CODES.UNAUTHORIZED,
    ERROR_CODES.TOKEN_EXPIRED,
    ERROR_CODES.INVALID_TOKEN,
  ] as string[];
  return authCodes.includes(error.code);
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: EchoError): boolean {
  const retryCodes = [
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.TIMEOUT_ERROR,
    ERROR_CODES.RATE_LIMITED,
    ERROR_CODES.SERVICE_UNAVAILABLE,
  ] as string[];
  return retryCodes.includes(error.code);
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: EchoError): string {
  switch (error.code) {
    case ERROR_CODES.UNAUTHORIZED:
    case ERROR_CODES.TOKEN_EXPIRED:
    case ERROR_CODES.INVALID_TOKEN:
      return 'Please sign in to continue';

    case ERROR_CODES.INSUFFICIENT_BALANCE:
      return 'Insufficient balance. Please add credits to your account.';

    case ERROR_CODES.RATE_LIMITED:
      return 'Too many requests. Please wait a moment and try again.';

    case ERROR_CODES.NETWORK_ERROR:
      return 'Connection failed. Please check your internet connection.';

    case ERROR_CODES.TIMEOUT_ERROR:
      return 'Request timed out. Please try again.';

    case ERROR_CODES.SERVICE_UNAVAILABLE:
      return 'Service is temporarily unavailable. Please try again later.';

    case ERROR_CODES.NOT_FOUND:
      return error.message || 'The requested resource was not found.';

    case ERROR_CODES.VALIDATION_ERROR:
      return error.message || 'Please check your input and try again.';

    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Base class with error handling for all resources
 */
export abstract class BaseResource {
  constructor(protected http: AxiosInstance) {}

  /**
   * Generic wrapper for API calls with consistent error handling
   */
  protected async handleRequest<T>(
    operation: () => Promise<AxiosResponse<T>>,
    context: string,
    endpoint?: string
  ): Promise<T> {
    try {
      const response = await operation();
      return response.data;
    } catch (error) {
      const echoError = parseEchoError(error, context, endpoint);
      throw echoError;
    }
  }

  /**
   * Handle errors and throw standardized EchoError
   */
  protected handleError(
    error: unknown,
    context: string,
    endpoint?: string
  ): never {
    const echoError = parseEchoError(error, context, endpoint);
    throw echoError;
  }
}

/**
 * Retry logic for retryable errors
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 200,
  context?: string
): Promise<T> {
  let lastError: EchoError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = parseEchoError(error, context);

      // Don't retry non-retryable errors
      if (!isRetryableError(lastError)) {
        throw lastError;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Wait before retrying (exponential backoff with jitter)
      const delay = delayMs * Math.pow(2, attempt - 1) + Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
