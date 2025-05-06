import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import compression from 'compression';
import { handleBody } from './helpers';
import { ReadableStream, ReadableStreamDefaultReader } from 'stream/web';

dotenv.config();

const app = express();
const port = 3000;

// OpenAI API base URL
const BASE_URL = 'https://api.openai.com/v1';

// Add middleware
app.use(express.json());
app.use(compression());

// Function to process headers
function processHeaders(headers: Record<string, string>): Record<string, string> {
    /**
     * Remove problematic headers
     * host, 
     * authorization, 
     * content-encoding,
     * content-length,
     * transfer-encoding
     * 
     * 
     * 
     * Does a processing step on the headers, in the future this will be an authentication step
     * which will be used to properly set the Openai API key
     */
    const { 
        host, 
        authorization, 
        'content-encoding': contentEncoding,
        'content-length': contentLength,
        'transfer-encoding': transferEncoding,
        connection,
        ...restHeaders 
    } = headers;
    
    // Ensure content-type is set correctly
    return {
        ...restHeaders,
        'content-type': 'application/json',
        'accept-encoding': 'gzip, deflate',
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    };
}

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
app.all('*', async (req: Request, res: Response) => {
    try {
        // Process headers
        const processedHeaders = processHeaders(req.headers as Record<string, string>);

        console.log("received request", req.path, req.method);
        if (req.body.stream) {
            req.body.stream_options = {
                include_usage: true
            };
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
                    handleBody(data, true);
                } catch (error) {
                    console.error('Error processing stream:', error);
                }
            })();
        } else {
            // Handle non-streaming response
            const data = await response.json();
            handleBody(JSON.stringify(data), false);
            res.setHeader('content-type', 'application/json'); // Set the content type to json
            res.json(data);
        }

    } catch (error) {
        console.error('Error handling request:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 