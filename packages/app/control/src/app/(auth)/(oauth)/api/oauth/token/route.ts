import { NextResponse } from 'next/server';

import z from 'zod';

import { createZodRoute } from '@/lib/api/create-route';

import { handleRefreshToken, handleRefreshTokenSchema } from './_lib/refresh';
import { handleIssueToken, handleIssueTokenSchema } from './_lib/issue';

import { logger } from '@/logger';

import type { TokenMetadata } from './_lib/types';

const bodySchema = z.discriminatedUnion('grant_type', [
  handleIssueTokenSchema.extend({
    grant_type: z.literal('authorization_code'),
  }),
  handleRefreshTokenSchema.extend({
    grant_type: z.literal('refresh_token'),
  }),
]);

export const POST = createZodRoute()
  .body(bodySchema)
  .handler(async (req, { body }) => {
    const metadata: TokenMetadata = {
      deviceName: undefined,
      userAgent:
        req.headers.get('x-client-user-agent') ||
        req.headers.get('user-agent') ||
        undefined,
      ipAddress:
        req.headers.get('x-client-ip') ||
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        req.headers.get('cf-connecting-ip') ||
        undefined,
    };

    switch (body.grant_type) {
      case 'authorization_code': {
        try {
          const result = await handleIssueToken(body, metadata);
          return NextResponse.json(result);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown error';
          logger.emit({
            severityText: 'WARN',
            body: 'Failed to issue OAuth token',
            attributes: {
              error: message,
            },
          });
          return NextResponse.json({ message }, { status: 400 });
        }
      }
      case 'refresh_token': {
        try {
          const result = await handleRefreshToken(body, metadata);
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
