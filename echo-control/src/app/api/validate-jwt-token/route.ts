import { validateApiTokenFast } from '@/lib/jwt-tokens';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/validate-jwt-token - Fast JWT validation without DB lookup
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Missing authorization header',
        },
        { status: 400 }
      );
    }

    // Fast JWT validation (no database lookup)
    const validationResult = await validateApiTokenFast(authHeader);

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
      // Note: No user/app details returned to keep this fast
      // If detailed info is needed, fall back to the regular validate-api-key endpoint
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
