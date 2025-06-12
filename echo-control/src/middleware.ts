import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// CORS configuration for OAuth endpoints
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const isOAuthRoute = createRouteMatcher(['/api/v1/(.*)', '/api/oauth(.*)']);

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/stripe/webhook(.*)',
  '/api/validate-jwt-token(.*)', // Fast JWT validation endpoint - no auth needed
  '/api/oauth/authorize(.*)', // OAuth authorize endpoint - handles its own auth
  '/api/oauth/token(.*)', // OAuth token endpoint - handles its own auth
  '/api/oauth/refresh(.*)', // OAuth refresh endpoint - handles its own auth
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Handle CORS for OAuth endpoints
  if (isOAuthRoute(req)) {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
    }

    // For actual requests, we'll add CORS headers in the response later
    // Just continue with normal processing
  }

  // For OAuth routes, add CORS headers to the response and pass through.
  // We do the authentication in the OAuth routes themselves (because they may require database access).
  if (isOAuthRoute(req)) {
    const response = NextResponse.next();
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
