import { createPathMatcher } from 'next-path-matcher';

import { NextRequest, NextResponse } from 'next/server';

import { Address } from 'viem';
import { paymentMiddleware, Network } from 'x402-next';
import { facilitator } from '@coinbase/x402';

import { middleware } from '@/auth/middleware';
import {
  formatAmountFromQueryParams,
  formatPriceForMiddleware,
} from '@/lib/base';

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
  runtime: 'nodejs',
};

export const x402MiddlewareGenerator = (req: NextRequest) => {
  const amount = formatAmountFromQueryParams(req);

  if (!amount) {
    return async () => {
      return NextResponse.json({ error: `Invalid amount` }, { status: 400 });
    };
  }

  const paymentAmount = formatPriceForMiddleware(amount);

  return paymentMiddleware(
    process.env.RESOURCE_WALLET_ADDRESS as Address,
    {
      '/api/v1/base/payment-link': {
        price: paymentAmount,
        network: process.env.NETWORK as Network,
        config: {
          description: 'Access to protected content',
        },
      },
    },
    facilitator,
    {
      appName: 'Echo Credits',
    }
  );
};

const isPublicRoute = createPathMatcher([
  // public pages
  '/',
  '/popular',
  '/login',
  '/verify-email',
  '/auth/signin(.*)',
  // public routes
  '/api/auth/(.*)',
  '/api/v1/(.*)',
  '/api/oauth(.*)',
  '/api/validate-jwt-token(.*)',
  '/api/apps/public',
  '/api/stripe/webhook(.*)',
  '/api/validate-jwt-token(.*)', // Fast JWT validation endpoint - no auth needed
  '/api/health(.*)', // Health check endpoint - no auth needed
]);

const isX402Route = createPathMatcher(['/api/v1/base/(.*)']);

export default middleware(req => {
  if (isX402Route(req)) {
    // For OPTIONS requests on x402 routes, pass to the next auth handler
    if (req.method === 'OPTIONS') {
      return NextResponse.next();
    }

    const paymentMiddleware = x402MiddlewareGenerator(req);
    return paymentMiddleware(req);
  }

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
