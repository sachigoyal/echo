import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import compression from 'compression';
import { ReadableStream } from 'stream/web';
import { accountManager } from './accounting/account';
import { HttpError, PaymentRequiredError } from './errors/http';
import accountRoutes from './routes/account';
import { verifyUserHeaderCheck } from './auth/headers';
import { getProvider } from './providers/ProviderFactory';

dotenv.config();

const app = express();
const port = 3069;

// Add middleware
app.use(express.json());
app.use(compression());

// Mount account routes
app.use('/account', accountRoutes);

// Function to duplicate a stream
function duplicateStream(stream: ReadableStream<Uint8Array>): [ReadableStream<Uint8Array>, ReadableStream<Uint8Array>] {
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
        // Process headers and instantiate provider
        const [user, processedHeaders] = await verifyUserHeaderCheck(req.headers as Record<string, string>);
        // assumption that "model" will always be passed in the body under this key
        // assumption that "stream" will always be passed in the body under this key
        // This currently works for everything implemented (OpenAI format + Anthropic native format)
        const provider = getProvider(req.body.model, user, req.body.stream, req.path);
        const authenticatedHeaders = provider.formatAuthHeaders(processedHeaders);

        console.log("Account balance: ", accountManager.getAccount(user));
    
        if (accountManager.getAccount(user) <= 0) {
            console.log("Payment required for user: ", user);
            throw new PaymentRequiredError();
        }


        console.log("new outbound request", `${provider.getBaseUrl()}${req.path}`, req.method);

        // make sure that streamUsage is set to true (openAI Format)
        req.body = provider.ensureStreamUsage(req.body);


        // Forward the request to Base Url API
        const response = await fetch(`${provider.getBaseUrl()}${req.path}`, {
            method: req.method,
            headers: authenticatedHeaders,
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });

        if (response.status != 200) {
            // decode the buffer
            const error = await response.json();
            console.error("Error response: ", error);
            return res.status(response.status).json({
                error: error
            });
        }

        // Check if this is a streaming response
        const isStreaming = response.headers.get('content-type')?.includes('text/event-stream');
        
        if (isStreaming) {
            // Handle streaming response
            const bodyStream = response.body as ReadableStream<Uint8Array>;
            if (!bodyStream) {
                throw new Error('No body stream returned from OpenAI API');
            }
            const [stream1, stream2] = duplicateStream(bodyStream);

            // Pipe the main stream directly to the response
            const reader1 = stream1.getReader();
            const reader2 = stream2.getReader();

            (async () => { // Pipe the main stream directly to the response
                try {
                    while (true) {
                        const { done, value } = await reader1.read();
                        if (done) break;
                        res.write(value);
                    }
                    res.end();
                } catch (error) {
                    console.error('Error reading stream:', error);
                }
            })();

            let data = '';
            (async () => { // Process the duped stream separately
                try {
                    while (true) {
                        const { done, value } = await reader2.read();
                        if (done) break;
                        data += new TextDecoder().decode(value);
                    }
                    provider.handleBody(data);
                } catch (error) {
                    console.error('Error processing stream:', error);
                }
            })();
        } else {
            // Handle non-streaming response
            const data = await response.json();
            provider.handleBody(JSON.stringify(data));
            res.setHeader('content-type', 'application/json'); // Set the content type to json
            res.json(data);
        }

    } catch (error) {
        next(error);
    }
});

// Error handling middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error handling request:', error);
    
    if (error instanceof HttpError) {
        res.status(error.statusCode).json({
            error: error.message
        });
    } else if (error instanceof Error) {
        // Handle other errors with a more specific message
        res.status(500).json({
            error: error.message || 'Internal Server Error'
        });
    } else {
        res.status(500).json({
            error: 'Internal Server Error'
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