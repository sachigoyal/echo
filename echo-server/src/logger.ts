import { logs } from '@opentelemetry/api-logs';
import {
  LoggerProvider,
  SimpleLogRecordProcessor,
} from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OpenTelemetryTransportV3 } from '@opentelemetry/winston-transport';
import { Resource } from '@opentelemetry/resources';
import { trace, context } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import winston from 'winston';
import dotenv from 'dotenv';

dotenv.config();

const OTEL_SERVICE_NAME = process.env.OTEL_SERVICE_NAME!;
const OTEL_SERVICE_VERSION = process.env.OTEL_SERVICE_VERSION!;
const NODE_ENV = process.env.NODE_ENV!;
const OTEL_EXPORTER_OTLP_ENDPOINT =
  process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT!;
const SIGNOZ_INGESTION_KEY = process.env.SIGNOZ_INGESTION_KEY!;

// Initialize the Logger provider
const loggerProvider = new LoggerProvider({
  resource: new Resource({
    'service.name': OTEL_SERVICE_NAME,
    'service.version': OTEL_SERVICE_VERSION,
    'deployment.environment': NODE_ENV,
  }),
});

const otlpExporter = new OTLPLogExporter({
  url: OTEL_EXPORTER_OTLP_ENDPOINT,
  headers: {
    'signoz-access-token': SIGNOZ_INGESTION_KEY,
  },
});

// Add processor with the OTLP exporter
loggerProvider.addLogRecordProcessor(
  new SimpleLogRecordProcessor(otlpExporter)
);

// Register the logger provider
logs.setGlobalLoggerProvider(loggerProvider);

// Custom Winston format to inject traceId/spanId
const traceContextFormat = winston.format((info) => {
  const span = trace.getSpan(context.active());
  if (span) {
    const spanContext = span.spanContext();
    info.traceId = spanContext.traceId;
    info.spanId = spanContext.spanId;
  }
  return info;
});

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    traceContextFormat(), // 👈 injects traceId/spanId into each log
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.metadata(),
    winston.format.json()
  ),
  defaultMeta: {
    service: OTEL_SERVICE_NAME,
    environment: NODE_ENV,
  },
  transports: [
    new winston.transports.Console(),
    new OpenTelemetryTransportV3(),
  ],
});

export default logger;
