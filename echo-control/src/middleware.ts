import { createPathMatcher } from 'next-path-matcher';

import { middleware } from '@/auth/middleware';
import { NextResponse } from 'next/server';

const isPublicRoute = createPathMatcher([
  // public pages
  '/',
  '/login',
  '/verify-email',
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
    // If the route does not exist (404), do not redirect to sign-in
    if (
      req.nextUrl.pathname.startsWith('/api/') ||
      req.nextUrl.pathname === '/404' ||
      req.nextUrl.pathname === '/_error'
    ) {
      // Let the request continue so the API or 404 handler can respond
      return NextResponse.next();
    }
    const newUrl = new URL('/login', req.nextUrl.origin);
    const redirectUrl = `${req.nextUrl.pathname}${req.nextUrl.search}`;
    newUrl.searchParams.set('redirect_url', redirectUrl);
    return Response.redirect(newUrl);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
