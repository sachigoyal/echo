import { UnauthorizedError } from '../errors/http';
import { verifyApiKey } from './verify';


export async function verifyUserHeaderCheck(headers: Record<string, string>): Promise<[string, Record<string, string>]> {
    /**
     * Process authentication for the user (authenticated with Merit Api Key)
     * 
     * 
     * We have to handle two cases:
     * 1. Authentication: Bearer Token
     * 2. x-api-key
     * 
     * 
     * This is because the Anthropic Native API uses x-api-key, but the OpenAI API format uses Bearer Token
     * 
     * 
     * We also swap problematic headers for the request (this is vibes IDK how much of this is needed)
     */

    const { 
        host, 
        authorization, 
        'content-encoding': contentEncoding,
        'content-length': contentLength,
        'transfer-encoding': transferEncoding,
        connection,
        "x-api-key": xApiKey,
        ...restHeaders 
    } = headers;


    if (!authorization && !xApiKey)  {
        throw new UnauthorizedError();
    }

    const user = await verifyApiKey(authorization || xApiKey);
    if (!user) {
        throw new UnauthorizedError();
    }

    return [user, 
        {
            ...restHeaders,
            'content-type': 'application/json',
            'accept-encoding': 'gzip, deflate',
        }
    ];

}