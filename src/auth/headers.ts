import { UnauthorizedError } from '../errors/http';
import { verifyApiKey } from './verify';

export async function processHeaders(headers: Record<string, string>): Promise<[string, Record<string, string>]> {
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
    if (user) {
        return [
            user, // User ID
            {
            ...restHeaders,
            'content-type': 'application/json',
            'accept-encoding': 'gzip, deflate',
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        }]
    }
    throw new UnauthorizedError();
} 