export async function register() {
  console.log('🚀 Instrumentation register() called');
  console.log('🔍 Runtime check:', process.env.NEXT_RUNTIME);

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Explicitly declare the OTLP endpoint from environment variable
    const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

    console.log('🌍 Environment variables:');
    console.log('  - OTEL_EXPORTER_OTLP_ENDPOINT:', otlpEndpoint);
    console.log('  - NEXT_OTEL_VERBOSE:', process.env.NEXT_OTEL_VERBOSE);

    if (!otlpEndpoint) {
      console.warn(
        '❌ OTEL_EXPORTER_OTLP_ENDPOINT is not set. OpenTelemetry traces will not be exported.'
      );
      return;
    }

    console.log(`📡 Initializing OpenTelemetry with endpoint: ${otlpEndpoint}`);

    // Set additional environment variables for debugging
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = otlpEndpoint;
    process.env.NEXT_OTEL_VERBOSE = '1'; // Enable verbose logging

    console.log('📝 Set NEXT_OTEL_VERBOSE=1 for debugging');

    try {
      const { registerOTel } = await import('@vercel/otel');
      const api = await import('@opentelemetry/api');

      console.log('📦 @vercel/otel imported successfully');

      // Initialize OpenTelemetry
      registerOTel({
        serviceName: 'echo-control',
      });

      console.log('✅ OpenTelemetry initialized successfully for echo-control');
      console.log(
        '🎯 Traces should appear in SigNoz with service name: echo-control'
      );

      // Intercept console logs and send them to OpenTelemetry
      interceptConsoleLogs(api);
    } catch (error) {
      console.error('❌ Failed to initialize OpenTelemetry:', error);
    }
  } else {
    console.log('⏭️  Skipping OpenTelemetry setup (not Node.js runtime)');
  }
}

/**
 * Intercepts all console methods and sends them to OpenTelemetry as logs
 */
function interceptConsoleLogs(api: typeof import('@opentelemetry/api')) {
  const tracer = api.trace.getTracer('console-interceptor');

  // Store original console methods
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };

  // Helper to create a span for each log
  const createLogSpan = (level: string, args: unknown[]) => {
    const span = tracer.startSpan(`console.${level}`);

    try {
      // Convert arguments to string for the log
      const logMessage = args
        .map(arg => {
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg);
            } catch (e) {
              console.error('Error stringifying object:', e);
              return String(arg);
            }
          }
          return String(arg);
        })
        .join(' ');

      // Add attributes to the span
      span.setAttribute('log.level', level);
      span.setAttribute('log.message', logMessage);

      // Add timestamp
      span.setAttribute('log.timestamp', new Date().toISOString());

      // End the span to send it to the collector
      span.end();
    } catch (error) {
      // If something goes wrong, end the span with an error
      if (error instanceof Error) {
        span.recordException(error);
      } else {
        span.recordException(new Error(String(error)));
      }
      span.end();
    }
  };

  // Override console methods
  console.log = (...args: unknown[]) => {
    createLogSpan('log', args);
    originalConsole.log(...args);
  };

  console.info = (...args: unknown[]) => {
    createLogSpan('info', args);
    originalConsole.info(...args);
  };

  console.warn = (...args: unknown[]) => {
    createLogSpan('warn', args);
    originalConsole.warn(...args);
  };

  console.error = (...args: unknown[]) => {
    createLogSpan('error', args);
    originalConsole.error(...args);
  };

  console.debug = (...args: unknown[]) => {
    createLogSpan('debug', args);
    originalConsole.debug(...args);
  };

  console.log('🔄 Console methods intercepted and connected to OpenTelemetry');
}
