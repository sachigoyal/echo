import { createZodRoute } from '@/lib/api/create-route';
import { OAuthError, OAuthErrorBody, OAuthErrorType } from './oauth-error';
import { NextResponse } from 'next/server';
import { HandlerServerErrorFn } from '@/lib/api/types';

export const handleOAuthError: HandlerServerErrorFn<OAuthErrorBody> = (
  error: Error
) => {
  if (error instanceof OAuthError) {
    return NextResponse.json(error.body, { status: 400 });
  }
  return NextResponse.json(
    { error: OAuthErrorType.SERVER_ERROR, error_description: error.message },
    { status: 500 }
  );
};

export const oauthRoute = createZodRoute({
  handleServerError: handleOAuthError,
});
