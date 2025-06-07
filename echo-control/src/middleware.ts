import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// CORS configuration for OAuth endpoints
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const isOAuthRoute = createRouteMatcher([
  '/api/oauth(.*)',
  '/api/validate-jwt-token(.*)', // JWT validation also needs CORS for browser testing
  '/api/balance(.*)', // Balance endpoint needs CORS for SPA access
  '/api/stripe/payment-link(.*)', // Payment link creation needs CORS for SPA access
]);

const isProtectedRoute = createRouteMatcher([
  '/',
  '/apps(.*)',
  '/cli-auth(.*)',
]);

const isApiRoute = createRouteMatcher([
  '/api/echo-apps(.*)',
  '/api/apps(.*)',
  '/api/api-keys(.*)',
  '/api/balance(.*)',
  '/api/stripe/payment-link(.*)',
]);

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/stripe/webhook(.*)',
  '/api/validate-api-key(.*)', // Public endpoint for external validation
  '/api/validate-jwt-token(.*)', // Fast JWT validation endpoint - no auth needed
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

  // Handle API routes with potential API key authentication
  if (isApiRoute(req)) {
    const authHeader = req.headers.get('authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // API key authentication - let the API routes handle validation
      // We just pass it through and let each route validate the key
      const response = NextResponse.next();

      // Add CORS headers if this is an OAuth route
      if (isOAuthRoute(req)) {
        Object.entries(CORS_HEADERS).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }

      return response;
    } else {
      // No API key, fall back to Clerk authentication
      await auth.protect();
    }
  }

  // Handle protected frontend routes with Clerk authentication
  if (!isPublicRoute(req) && isProtectedRoute(req)) {
    await auth.protect();
  }

  // For OAuth routes, add CORS headers to the response
  if (isOAuthRoute(req)) {
    const response = NextResponse.next();
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
