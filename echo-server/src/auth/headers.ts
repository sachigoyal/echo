import { UnauthorizedError } from '../errors/http';
import { EchoControlService } from '../services/EchoControlService';
import logger from '../logger';

export const verifyUserHeaderCheck = async (
  headers: Record<string, string>
): Promise<[Record<string, string>, EchoControlService]> => {
  /**
   * Process authentication for the user (authenticated with Echo Api Key)
   *
   * We have to handle two cases:
   * 1. Authentication: Bearer Token
   * 2. x-api-key
   *
   * This is because the Anthropic Native API uses x-api-key, but the OpenAI API format uses Bearer Token
   *
   * We also swap problematic headers for the request (this is vibes IDK how much of this is needed).
   * Some of the removal of headers is absolutely necessary.
   *
   * @returns [processedHeaders, echoControlService]
   */
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const {
    host: _host,
    authorization,
    'content-encoding': _contentEncoding,
    'content-length': _contentLength,
    'transfer-encoding': _transferEncoding,
    connection: _connection,
    'x-api-key': xApiKey,
    'x-goog-api-key': xGoogleApiKey,
    ...restHeaders
  } = headers;
  /* eslint-enable @typescript-eslint/no-unused-vars */

  if (!(authorization || xApiKey || xGoogleApiKey)) {
    logger.error('Missing authentication headers:', { headers });
    throw new UnauthorizedError('Please include auth headers.');
  }

  const apiKey = authorization ?? xApiKey ?? xGoogleApiKey;

  const cleanApiKey = apiKey?.replace('Bearer ', '') ?? '';

  const echoControlService = new EchoControlService(cleanApiKey);
  const authResult = await echoControlService.verifyApiKey();

  if (!authResult) {
    throw new UnauthorizedError('Authentication failed.');
  }

  return [
    {
      ...restHeaders,
      'content-type': 'application/json',
      'accept-encoding': 'gzip, deflate',
    },
    echoControlService,
  ];
};
