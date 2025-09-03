import { authorizeParamsSchema } from '@/app/(auth)/_lib/authorize';
import { createZodRoute } from '@/app/api/_utils/create-route';
import { db } from '@/lib/db';
import { getApp } from '@/services/apps/app';
import { NextResponse } from 'next/server';
import z from 'zod';

const querySchema = authorizeParamsSchema.extend({
  prompt: z.literal('none').optional(),
});

export const GET = createZodRoute()
  .query(querySchema)
  .handler(async (request, context) => {
    const echoApp = await getApp(context.query.client_id);
    if (!echoApp) {
      return NextResponse.json(
        { error: 'Echo app not found' },
        { status: 404 }
      );
    }

    const isLocalhostUrl =
      context.query.redirect_uri.startsWith('http://localhost:');
    const redirectUriWithoutTrailingSlash = context.query.redirect_uri.replace(
      /\/$/,
      ''
    );
    const isAuthorizedUrl =
      isLocalhostUrl ||
      echoApp.authorizedCallbackUrls.includes(context.query.redirect_uri) ||
      echoApp.authorizedCallbackUrls.includes(redirectUriWithoutTrailingSlash);
  });
