import express, { Request, Response, NextFunction, Express } from 'express';
import dotenv from 'dotenv';
import compression from 'compression';
import cors from 'cors';
import { ReadableStream } from 'stream/web';
import { HttpError, PaymentRequiredError } from './errors/http';
import { verifyUserHeaderCheck } from './auth/headers';
import { getProvider } from './providers/ProviderFactory';
import { isValidModel } from './services/AccountingService';
import {
  extractIsStream,
  extractModelName,
} from './services/RequestDataService';
import { extractAppIdFromPath } from './services/PathDataService';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3069;

// Add middleware
app.use(
  cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowedHeaders: '*', // Allow all headers
    exposedHeaders: '*', // Expose all headers to the client
    credentials: false, // Set to false when using origin: '*'
    preflightContinue: false, // Handle preflight requests here
    optionsSuccessStatus: 200, // Return 200 for preflight OPTIONS requests
  })
);
app.use(express.json({ limit: '100mb' }));
app.use(compression());

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.version,
  });
});

// Function to duplicate a stream
function duplicateStream(
  stream: ReadableStream<Uint8Array>
): [ReadableStream<Uint8Array>, ReadableStream<Uint8Array>] {
  /**
   * Duplicate a stream
   *
   * This is a helper function to duplicate a stream
   */
  return stream.tee();
}

// Main route handler
app.all('*', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract app ID from path if present
    const { appId, remainingPath } = extractAppIdFromPath(req.path);

    // Use the remaining path for provider forwarding, or original path if no app ID found
    const forwardingPath = appId ? remainingPath : req.path;

    // Process headers and instantiate provider
    const [processedHeaders, echoControlService] = await verifyUserHeaderCheck(
      req.headers as Record<string, string>
    );

    if (appId) {
      const authResult = echoControlService.getAuthResult();
      if (!authResult?.echoAppId || authResult.echoAppId !== appId) {
        return res.status(401).json({
          error: 'Unauthorized use of this app.',
        });
      }
    }

    // assumption that "model" will always be passed in the body under this key
    // assumption that "stream" will always be passed in the body under this key
    // This currently works for everything implemented (OpenAI format + Anthropic native format)

    const model = extractModelName(req);

    if (!model || !isValidModel(model)) {
      console.error('Invalid model: ', model);
      return res.status(422).json({
        error: `Invalid model: ${model} Echo does not yet support this model.`,
      });
    }

    const isStream = extractIsStream(req);

    const provider = getProvider(
      model,
      echoControlService,
      isStream,
      forwardingPath
    );

    if (!provider.supportsStream() && isStream) {
      return res.status(422).json({
        error: `Model ${model} does not support streaming.`,
      });
    }

    const authenticatedHeaders = provider.formatAuthHeaders(processedHeaders);
    const balance = await echoControlService.getBalance();

    if (balance <= 0) {
      const userId = echoControlService.getUserId();
      console.log('Payment required for user:', userId);
      throw new PaymentRequiredError();
    }

    console.log(
      'new outbound request',
      `${provider.getBaseUrl(forwardingPath)}${forwardingPath}`,
      req.method
    );

    // make sure that streamUsage is set to true (openAI Format)
    req.body = provider.ensureStreamUsage(req.body, forwardingPath);

    // Forward the request to Base Url API
    const response = await fetch(
      `${provider.getBaseUrl(forwardingPath)}${forwardingPath}`,
      {
        method: req.method,
        headers: authenticatedHeaders,
        ...(req.method !== 'GET' && { body: JSON.stringify(req.body) }),
      }
    );

    if (response.status != 200) {
      // decode the buffer
      const error = await response.json();
      console.error('Error response: ', error);
      return res.status(response.status).json({
        error: error,
      });
    }

    if (isStream) {
      // Handle streaming response
      const bodyStream = response.body as ReadableStream<Uint8Array>;
      if (!bodyStream) {
        throw new Error('No body stream returned from OpenAI API');
      }
      const [stream1, stream2] = duplicateStream(bodyStream);

      // Pipe the main stream directly to the response
      const reader1 = stream1.getReader();
      const reader2 = stream2.getReader();

      // Promise for streaming data to client
      const streamToClientPromise = (async () => {
        try {
          while (true) {
            const { done, value } = await reader1.read();
            if (done) break;
            res.write(value);
          }
        } catch (error) {
          console.error('Error reading stream:', error);
          throw error;
        }
      })();

      // Promise for processing data and creating transaction
      const processDataPromise = (async () => {
        let data = '';
        try {
          while (true) {
            const { done, value } = await reader2.read();
            if (done) break;
            data += new TextDecoder().decode(value);
          }
          // Wait for transaction to complete before resolving
          await provider.handleBody(data);
        } catch (error) {
          console.error('Error processing stream:', error);
          throw error;
        }
      })();

      // Wait for both streams to complete before ending response
      try {
        await Promise.all([streamToClientPromise, processDataPromise]);
        res.end();
      } catch (error) {
        console.error('Error in stream coordination:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Stream processing failed' });
        }
      }

      return;
    } else {
      // Handle non-streaming response
      const data = await response.json();
      await provider.handleBody(JSON.stringify(data));
      res.setHeader('content-type', 'application/json'); // Set the content type to json
      return res.json(data);
    }
  } catch (error) {
    return next(error);
  }
});

// Error handling middleware
app.use((error: Error, req: Request, res: Response) => {
  console.error('Error handling request:', error);

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      error: error.message,
    });
  } else if (error instanceof Error) {
    // Handle other errors with a more specific message
    res.status(500).json({
      error: error.message || 'Internal Server Error',
    });
  } else {
    res.status(500).json({
      error: 'Internal Server Error',
    });
  }
});

// Only start the server if this file is being run directly
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
