import express, { Request, Response } from 'express';
import { Readable } from 'stream';
import fetch, { Headers } from 'node-fetch';
import dotenv from 'dotenv';
import compression from 'compression';
import { handleBody } from './helpers';

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
        ...restHeaders 
    } = headers;
    
    // Ensure content-type is set correctly
    return {
        ...restHeaders,
        'content-type': 'application/json',
        'accept-encoding': 'gzip, deflate',
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    };
}



// Function to duplicate a stream
function duplicateStream(stream: Readable): [Readable, Readable] {
    const stream1 = new Readable({
        read() {}
    });
    const stream2 = new Readable({
        read() {}
    });

    stream.on('data', (chunk) => {
        stream1.push(chunk);
        stream2.push(chunk);
    });

    stream.on('end', () => {
        stream1.push(null);
        stream2.push(null);
    });

    stream.on('error', (error) => {
        stream1.destroy(error);
        stream2.destroy(error);
    });

    return [stream1, stream2];
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
            const bodyStream = response.body as Readable;
            const [stream1, stream2] = duplicateStream(bodyStream);

            // Pipe the main stream directly to the response
            stream1.on('data', (chunk) => {
                res.write(chunk);
            });
            stream1.on('end', () => {
                res.end();
            });

            // Handle the processing stream separately
            let data: string = '';
            stream2.on('data', (chunk) => {
                data += chunk.toString();
            });
            stream2.on('end', () => {
                handleBody(data, true);
            });
            stream2.on('error', (error) => {
                console.error('Error processing stream:', error);
            });
        } else {
            // Handle non-streaming response
            const data = await response.json();
            handleBody(JSON.stringify(data), false);
            res.setHeader('content-type', 'application/json');
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