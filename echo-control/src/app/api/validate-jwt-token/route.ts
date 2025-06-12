import { validateEchoAccessJwtTokenFast } from '@/lib/jwt-tokens';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/validate-jwt-token - Fast JWT validation without DB lookup
export async function POST(request: NextRequest) {
  try {
    // Use X-Echo-Token header instead of Authorization to avoid Clerk middleware conflicts
    const echoTokenHeader = request.headers.get('x-echo-token');
    const authHeader = request.headers.get('authorization');

    const tokenToValidate = echoTokenHeader || authHeader;

    if (!tokenToValidate) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Missing token header (use Authorization or X-Echo-Token)',
        },
        { status: 400 }
      );
    }

    // If using X-Echo-Token header, add "Bearer " prefix if not present
    const tokenWithBearer =
      echoTokenHeader && !echoTokenHeader.startsWith('Bearer ')
        ? `Bearer ${echoTokenHeader}`
        : tokenToValidate;

    // Fast JWT validation (no database lookup)
    const validationResult =
      await validateEchoAccessJwtTokenFast(tokenWithBearer);

    if (!validationResult.valid) {
      return NextResponse.json(
        {
          valid: false,
          error: validationResult.error || 'Invalid token',
        },
        { status: 401 }
      );
    }

    // Return validation success with decoded token info
    return NextResponse.json({
      valid: true,
      userId: validationResult.userId,
      appId: validationResult.appId,
      scope: validationResult.scope,
    });
  } catch (error) {
    console.error('JWT token validation error:', error);
    return NextResponse.json(
      {
        valid: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Legacy GET support for backward compatibility
export async function GET(request: NextRequest) {
  return POST(request);
}
