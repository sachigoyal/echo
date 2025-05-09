import { UnauthorizedError } from '../errors/http';
import { verifyApiKey } from './verify';


const determineApiKey = (model: string) => {
    if (model.includes("claude")) {
        return process.env.ANTHROPIC_API_KEY;
    } else {
        return process.env.OPENAI_API_KEY;
    }
}


export async function processHeaders(headers: Record<string, string>, model: string): Promise<[string, Record<string, string>]> {
    /**
     * Remove problematic headers
     * host, 
     * authorization, 
     * content-encoding,
     * content-length,
     * transfer-encoding
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

    if (!authorization) {
        throw new UnauthorizedError();
    }

    const user = await verifyApiKey(authorization);
    if (!user) {
        throw new UnauthorizedError();
    }

    const apiKey = determineApiKey(model);

    if (!apiKey) {
        throw new UnauthorizedError();
    }

    return [
        user, // User ID
        {
            ...restHeaders,
            'content-type': 'application/json',
            'accept-encoding': 'gzip, deflate',
            "Authorization": `Bearer ${apiKey}`
        }
    ]
} 