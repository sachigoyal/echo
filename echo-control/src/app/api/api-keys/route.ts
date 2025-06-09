import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { randomBytes, randomUUID } from 'crypto';

// GET /api/api-keys - List API keys for authenticated user
export async function GET() {
  try {
    const user = await getCurrentUser();

    const apiKeys = await db.apiKey.findMany({
      where: {
        userId: user.id,
        isArchived: false, // Only return non-archived API keys
        echoApp: {
          isArchived: false, // Only include API keys from non-archived apps
        },
      },
      include: {
        echoApp: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ apiKeys });
  } catch (error) {
    console.error('Error fetching API keys:', error);

    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate a secure API key using UUID v4 and additional entropy
function generateApiKey(): string {
  const prefix = process.env.API_KEY_PREFIX || 'echo_';

  // Use UUID v4 for structured randomness
  const uuidPart = randomUUID().replace(/-/g, '');

  // Add additional cryptographic entropy (16 bytes = 32 hex chars)
  const entropyPart = randomBytes(16).toString('hex');

  // Combine for maximum security: prefix + UUID + entropy
  return `${prefix}${uuidPart}${entropyPart}`;
}

// POST /api/api-keys - Create a new API key for authenticated user
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { echoAppId, name } = body;

    if (!echoAppId) {
      return NextResponse.json(
        { error: 'Echo App ID is required' },
        { status: 400 }
      );
    }

    // Verify the echo app exists and belongs to the user
    const echoApp = await db.echoApp.findFirst({
      where: {
        id: echoAppId,
        userId: user.id,
        isArchived: false, // Only allow creating API keys for non-archived apps
      },
    });

    if (!echoApp) {
      return NextResponse.json(
        { error: 'Echo app not found or access denied' },
        { status: 404 }
      );
    }

    // Generate a new API key
    const generatedKey = generateApiKey();

    // Create the API key - echoAppId is now required
    const apiKey = await db.apiKey.create({
      data: {
        key: generatedKey,
        name: name || 'Unnamed API Key',
        userId: user.id,
        echoAppId, // This is now required and not nullable
      },
      include: {
        echoApp: true,
      },
    });

    return NextResponse.json({ apiKey }, { status: 201 });
  } catch (error) {
    console.error('Error creating API key:', error);

    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
