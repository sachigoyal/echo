import { NextRequest, NextResponse } from 'next/server';

// Legacy redirect: /api/echo-apps -> /api/apps
export async function GET(req: NextRequest) {
  const url = new URL('/api/apps', req.url);

  // Forward query parameters if any
  const searchParams = new URL(req.url).searchParams;
  for (const [key, value] of searchParams.entries()) {
    url.searchParams.set(key, value);
  }

  return NextResponse.redirect(url, 308); // Permanent redirect
}

export async function POST(req: NextRequest) {
  const url = new URL('/api/apps', req.url);
  return NextResponse.redirect(url, 308);
}
