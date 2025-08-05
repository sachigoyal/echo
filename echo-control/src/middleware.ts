import { createPathMatcher } from 'next-path-matcher';

import { auth } from '@/auth';
import { NextResponse } from 'next/server';

const isPublicRoute = createPathMatcher([
  '/',
  '/api/auth/(.*)',
  '/api/v1/(.*)',
  '/api/oauth(.*)',
  '/api/validate-jwt-token(.*)',
  '/sign-in(.*)',
  '/api/apps/public',
  '/api/stripe/webhook(.*)',
  '/api/validate-jwt-token(.*)', // Fast JWT validation endpoint - no auth needed
  '/api/oauth/authorize(.*)', // OAuth authorize endpoint - handles its own auth
  '/api/oauth/token(.*)', // OAuth token endpoint - handles its own auth
  '/api/health(.*)', // Health check endpoint - no auth needed
]);

export default auth(req => {
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  console.log('req.auth', req.auth);

  if (!req.auth) {
    const newUrl = new URL('/sign-in', req.nextUrl.origin);
    return Response.redirect(newUrl);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
