import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import compression from 'compression';
import { handleBody } from './helpers';
import { ReadableStream } from 'stream/web';
import { accountManager } from './accounting/account';
import { HttpError, PaymentRequiredError } from './errors/http';
import accountRoutes from './routes/account';
import { processHeaders } from './auth/headers';

dotenv.config();

const app = express();
const port = 3000;

// OpenAI API base URL
const BASE_URL = 'https://api.openai.com/v1';

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
        // Process headers
        const [user, processedHeaders] = await processHeaders(req.headers as Record<string, string>);

        console.log("received request", req.path, req.method);
        if (req.body.stream) {
            req.body.stream_options = {
                include_usage: true
            };
        }

        if (accountManager.getAccount(user) <= 0) {
            throw new PaymentRequiredError();
        }

        // Forward the request to OpenAI API
        const response = await fetch(`${BASE_URL}${req.path}`, {
            method: req.method,
            headers: processedHeaders,
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });

        console.log("new outbound request", `${BASE_URL}${req.path}`, req.method);

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
                    handleBody(user, data, true);
                } catch (error) {
                    console.error('Error processing stream:', error);
                }
            })();
        } else {
            // Handle non-streaming response
            const data = await response.json();
            handleBody(user, JSON.stringify(data), false);
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
    } else {
        res.status(500).json({
            error: 'Internal Server Error'
        });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 