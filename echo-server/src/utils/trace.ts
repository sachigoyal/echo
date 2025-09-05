import { context, trace } from '@opentelemetry/api';

/**
 * Get the current request ID from OpenTelemetry trace context
 * @returns The trace ID as request ID for correlation
 * @throws Error if no trace context is available
 */
export function getRequestId(): string {
  const span = trace.getSpan(context.active());
  if (span) {
    const spanContext = span.spanContext();
    return spanContext.traceId;
  }
  throw new Error('No trace context available');
}

/**
 * Get the current request ID from OpenTelemetry trace context safely
 * @returns The trace ID as request ID, or null if no trace context is available
 */
export function getRequestIdSafe(): string | null {
  try {
    return getRequestId();
  } catch {
    return null;
  }
}
