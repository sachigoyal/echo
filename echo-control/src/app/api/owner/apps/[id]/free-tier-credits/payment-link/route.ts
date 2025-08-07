import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  createFreeTierPaymentLink,
  isValidUrl,
} from '@/lib/stripe/payment-link';
import { PermissionService, Permission } from '@/lib/permissions';
import Stripe from 'stripe';

// POST /api/owner/apps/[id]/free-tier-credits/payment-link - Create payment link for free tier credits
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id: appId } = await params;
    const body = await request.json();

    // Verify user has permission to manage billing for this app
    const hasPermission = await PermissionService.hasPermission(
      user.id,
      appId,
      Permission.MANAGE_BILLING
    );

    if (!hasPermission) {
      return NextResponse.json(
        {
          error:
            'Permission denied - only app owners can create free tier payment links',
        },
        { status: 403 }
      );
    }

    // Validate callback URLs if provided
    if (body.successUrl && !isValidUrl(body.successUrl)) {
      return NextResponse.json(
        { error: 'Invalid success URL format' },
        { status: 400 }
      );
    }

    // Create payment link with app context for free tier credits
    const result = await createFreeTierPaymentLink(user, appId, body);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating free tier payment link:', error);

    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === 'App not found') {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    if (
      error instanceof Error &&
      error.message === 'Valid amount is required'
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {
          error: 'Stripe error: ' + error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
