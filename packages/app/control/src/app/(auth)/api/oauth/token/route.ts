import { handleRefreshToken, handleRefreshTokenSchema } from './_lib/refresh';
import { NextResponse } from 'next/server';
import { logger } from '@/logger';
import z from 'zod';
import { createZodRoute } from '@/app/api/_utils/create-route';

const bodySchema = z.discriminatedUnion('grant_type', [
  z.object({
    grant_type: z.literal('authorization_code'),
    code: z.string(),
    redirect_uri: z.string(),
    code_verifier: z.string(),
    client_id: z.uuid().optional(),
  }),
  handleRefreshTokenSchema.extend({
    grant_type: z.literal('refresh_token'),
  }),
]);

export const POST = createZodRoute()
  .body(bodySchema)
  .handler(async (req, { body }) => {
    const deviceName = undefined; // derive later from userAgent if desired
    const forwardedUserAgent =
      req.headers.get('x-client-user-agent') ||
      req.headers.get('user-agent') ||
      undefined;
    const forwardedIp =
      req.headers.get('x-client-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      req.headers.get('cf-connecting-ip') ||
      undefined;

    switch (body.grant_type) {
      case 'authorization_code':
        const { code, redirect_uri, code_verifier } = body;

        const result = await handleInitialTokenIssuance({
          code,
          redirect_uri,
          client_id,
          code_verifier,
          deviceName,
          userAgent: forwardedUserAgent,
          ipAddress: forwardedIp,
        });

        // Check if result is an error
        if ('error' in result) {
          logger.emit({
            severityText: 'WARN',
            body: 'Failed to issue OAuth token',
            attributes: {
              error: result.error,
              error_description: result.error_description,
              client_id,
            },
          });
          return NextResponse.json(result, { status: 400 });
        }

        logger.emit({
          severityText: 'INFO',
          body: 'Successfully issued OAuth token',
          attributes: {
            client_id,
            grant_type: 'authorization_code',
          },
        });

        // Return successful token response
        return NextResponse.json(result);
      case 'refresh_token': {
        const { grant_type, ...refreshTokenBody } = body;

        try {
          const result = await handleRefreshToken(refreshTokenBody, {
            userAgent: forwardedUserAgent,
            ipAddress: forwardedIp,
            deviceName,
          });

          return NextResponse.json(result);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown error';
          logger.emit({
            severityText: 'WARN',
            body: 'Failed to refresh OAuth token',
            attributes: {
              error: message,
            },
          });
          return NextResponse.json({ message }, { status: 400 });
        }
      }
    }
  });
