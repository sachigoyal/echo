import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

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
  // Handle API routes with potential API key authentication
  if (isApiRoute(req)) {
    const authHeader = req.headers.get('authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // API key authentication - let the API routes handle validation
      // We just pass it through and let each route validate the key
      return NextResponse.next();
    } else {
      // No API key, fall back to Clerk authentication
      await auth.protect();
    }
  }

  // Handle protected frontend routes with Clerk authentication
  if (!isPublicRoute(req) && isProtectedRoute(req)) {
    await auth.protect();
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
