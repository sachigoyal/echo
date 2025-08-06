import { createPathMatcher } from 'next-path-matcher';

import { middleware } from '@/auth/middleware';
import { NextResponse } from 'next/server';

const isPublicRoute = createPathMatcher([
  // public pages
  '/',
  '/sign-in(.*)',
  // public routes
  '/api/auth/(.*)',
  '/auth/signin(.*)',
  '/api/v1/(.*)',
  '/api/oauth(.*)',
  '/api/validate-jwt-token(.*)',
  '/api/apps/public',
  '/api/stripe/webhook(.*)',
  '/api/validate-jwt-token(.*)', // Fast JWT validation endpoint - no auth needed
  '/api/health(.*)', // Health check endpoint - no auth needed
]);

export default middleware(req => {
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

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
