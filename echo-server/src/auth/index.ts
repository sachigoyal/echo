import { UnauthorizedError } from '../errors/http';
import type { PrismaClient } from '../generated/prisma';
import { EchoControlService } from '../services/EchoControlService';
import { extractAppIdFromPath } from '../services/PathDataService';
import { verifyUserHeaderCheck } from './headers';

/**
 * Handles complete authentication flow including path extraction, header verification, and app ID validation.
 *
 * This function:
 * 1. Extracts app ID from the request path if present
 * 2. Verifies user authentication headers
 * 3. Validates that the authenticated user has permission to use the specified app
 *
 * @param path - The request path
 * @param headers - The request headers
 * @returns Object containing processedHeaders, echoControlService, and forwardingPath
 * @throws UnauthorizedError if authentication fails or app ID validation fails
 */
export async function authenticateRequest(
  path: string,
  headers: Record<string, string>,
  prisma: PrismaClient
): Promise<{
  processedHeaders: Record<string, string>;
  echoControlService: EchoControlService;
  forwardingPath: string;
}> {
  // Extract app ID from path if present
  const { appId: pathAppId, remainingPath } = extractAppIdFromPath(path);

  // Use the remaining path for provider forwarding, or original path if no app ID found
  const forwardingPath = pathAppId ? remainingPath : path;

  // Process headers and instantiate provider
  const [processedHeaders, echoControlService] = await verifyUserHeaderCheck(
    headers,
    prisma
  );

  // Validate app ID authorization if app ID is in path
  if (pathAppId) {
    const authResult = echoControlService.getAuthResult();
    if (!authResult?.echoAppId || authResult.echoAppId !== pathAppId) {
      throw new UnauthorizedError('Unauthorized use of this app.');
    }
  }

  return {
    processedHeaders,
    echoControlService,
    forwardingPath,
  };
}
