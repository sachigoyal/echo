// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

// Initialize the SDK before any other imports
const sdk = new NodeSDK({
  instrumentations: [
    getNodeAutoInstrumentations({
      // Disable file system instrumentation which can be noisy
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
      // Configure HTTP instrumentation to ignore health checks
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        ignoreIncomingRequestHook: req => {
          const url = req.url || '';
          return url.includes('/health');
        },
      },
      // Ensure Express instrumentation is enabled
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
    }),
  ],
});

// Start the SDK
sdk.start();

console.log('OpenTelemetry started for echo-server');

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => {
      console.log('OpenTelemetry shut down successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error shutting down OpenTelemetry SDK', error);
      process.exit(1);
    });
});

export default sdk;
