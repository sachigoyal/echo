import { UnauthorizedError } from '../errors/http';
import { echoControlService, AuthenticationResult } from '../services/EchoControlService';

export async function verifyUserHeaderCheck(headers: Record<string, string>): Promise<[AuthenticationResult, Record<string, string>, string]> {
    /**
     * Process authentication for the user (authenticated with Echo Api Key)
     * 
     * We have to handle two cases:
     * 1. Authentication: Bearer Token
     * 2. x-api-key
     * 
     * This is because the Anthropic Native API uses x-api-key, but the OpenAI API format uses Bearer Token
     * 
     * We also swap problematic headers for the request (this is vibes IDK how much of this is needed)
     * 
     * @returns [AuthenticationResult, processedHeaders, originalApiKey]
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

    const apiKey = authorization || xApiKey;

    const cleanApiKey = apiKey.replace("Bearer ", "");

    const authResult = await echoControlService.verifyApiKey(cleanApiKey);
    
    if (!authResult) {
        throw new UnauthorizedError();
    }

    return [
        authResult, 
        {
            ...restHeaders,
            'content-type': 'application/json',
            'accept-encoding': 'gzip, deflate',
        },
        cleanApiKey
    ];
}