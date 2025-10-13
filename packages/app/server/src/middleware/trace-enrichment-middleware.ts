// trace-enrichment-middleware.ts
import { context, trace } from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import { NextFunction, Request, Response } from 'express';
import logger from '../logger';

// This middleware enriches every request span and logs responses
export function traceEnrichmentMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const startTime = Date.now();
  const span = trace.getSpan(context.active());
  const traceId = span?.spanContext().traceId || 'no-trace';

  // Store trace ID on request for later use
  (req as any).traceId = traceId;

  // Log inbound request
  logger.info('REQUEST', {
    traceId,
    method: req.method,
    path: req.path,
    body: req.body,
  });

  // Set up span enrichment and logging on response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // Log response
    logger.info('RESPONSE', {
      traceId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
    });

    // Enrich OpenTelemetry span
    const span = trace.getSpan(context.active());
    if (!span) return;

    // 🔹 Standard semantic HTTP attributes
    span.setAttribute(SemanticAttributes.HTTP_METHOD, req.method);
    span.setAttribute(
      SemanticAttributes.HTTP_ROUTE,
      req.route?.path || req.path
    );
    span.setAttribute(SemanticAttributes.HTTP_TARGET, req.originalUrl);
    span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, res.statusCode);

    // Mark span status (0=UNSET, 1=OK, 2=ERROR)
    if (res.statusCode >= 500) {
      span.setStatus({ code: 2, message: `HTTP ${res.statusCode}` });
    } else {
      span.setStatus({ code: 1 });
    }
  });

  next();
}
