import { Storage } from '@google-cloud/storage';
import { Request, Response, Router } from 'express';
import { authenticateRequest } from '../auth';
import { HttpError } from '../errors/http';
import logger from '../logger';
import { prisma } from '../server';

const storageRouter = Router();

// Initialize Google Cloud Storage
let storage: Storage | null = null;

function getStorage(): Storage {
  if (!storage) {
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new HttpError(
        500,
        'GOOGLE_SERVICE_ACCOUNT_KEY environment variable not set'
      );
    }

    storage = new Storage({
      credentials: JSON.parse(serviceAccountKey),
    });
  }
  return storage;
}

/**
 * POST /v1/storage/signed-url
 * Generate a signed URL for accessing a GCS object
 *
 * Body:
 * {
 *   "gcsUri": "gs://echo-veo3-videos/{userId}/path/to/file.mp4"
 * }
 *
 * Response:
 * {
 *   "signedUrl": "https://storage.googleapis.com/...",
 *   "expiresAt": "2024-01-01T00:00:00.000Z"
 * }
 */
storageRouter.post(
  '/v1/storage/signed-url',
  async (req: Request, res: Response) => {
    try {
      // Authenticate the request
      const { echoControlService } = await authenticateRequest(
        req.headers as Record<string, string>,
        prisma
      );

      const userId = echoControlService.getUserId();
      if (!userId) {
        throw new HttpError(401, 'User ID not found');
      }

      const { gcsUri } = req.body;
      if (!gcsUri || typeof gcsUri !== 'string') {
        throw new HttpError(400, 'gcsUri is required and must be a string');
      }

      // Validate GCS URI format: gs://bucket-name/path/to/file
      if (!gcsUri.startsWith('gs://')) {
        throw new HttpError(
          400,
          'Invalid GCS URI format. Must start with gs://'
        );
      }

      // Parse the GCS URI
      const uriWithoutProtocol = gcsUri.substring(5); // Remove 'gs://'
      const firstSlashIndex = uriWithoutProtocol.indexOf('/');

      if (firstSlashIndex === -1) {
        throw new HttpError(
          400,
          'Invalid GCS URI format. Must include bucket and path'
        );
      }

      const bucketName = uriWithoutProtocol.substring(0, firstSlashIndex);
      const filePath = uriWithoutProtocol.substring(firstSlashIndex + 1);

      // Security: Verify the user can only access files in their folder
      // Expected format: echo-veo3-videos/{userId}/...
      const expectedPrefix = `${userId}/`;
      if (!filePath.startsWith(expectedPrefix)) {
        logger.warn(
          `Access denied: User ${userId} tried to access ${filePath}`
        );
        throw new HttpError(
          403,
          'Access denied: You can only access files in your own folder'
        );
      }

      logger.info(
        `Generating signed URL for user ${userId}, bucket: ${bucketName}, file: ${filePath}`
      );

      // Generate signed URL
      const storage = getStorage();
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(filePath);

      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        throw new HttpError(404, 'File not found');
      }

      // Generate signed URL valid for 1 hour
      const expirationTime = Date.now() + 3600 * 1000; // 1 hour
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: expirationTime,
      });

      logger.info(`Signed URL generated successfully for ${filePath}`);

      res.json({
        signedUrl,
        expiresAt: new Date(expirationTime).toISOString(),
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      logger.error('Error generating signed URL:', error);
      throw new HttpError(
        500,
        error instanceof Error ? error.message : 'Failed to generate signed URL'
      );
    }
  }
);

export default storageRouter;
