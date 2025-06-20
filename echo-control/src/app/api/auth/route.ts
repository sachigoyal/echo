// Placeholder - OAuth endpoints will be implemented separately
// This file can be used for other auth-related endpoints if needed

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Auth endpoints available at /api/oauth/*',
    endpoints: {
      authorize: '/api/oauth/authorize',
      token: '/api/oauth/token',
      refresh: '/api/oauth/token',
    },
    oauth_config: {
      note: 'Configure authorized callback URLs via /api/echo-apps/{id}/oauth-config',
      security: 'All redirect URIs must be pre-registered for security',
    },
  });
}
