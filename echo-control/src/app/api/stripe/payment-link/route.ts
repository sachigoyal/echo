import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// POST /api/stripe/payment-link - Generate payment link (mocked) for authenticated user
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await request.json()
    const { amount, description = 'Echo Credits' } = body

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 })
    }

    // Mock Stripe payment link generation
    const mockPaymentIntentId = `pi_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const mockPaymentLink = `https://checkout.stripe.com/pay/mock_${mockPaymentIntentId}`

    // Create pending payment record
    const payment = await db.payment.create({
      data: {
        stripePaymentId: mockPaymentIntentId,
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        status: 'pending',
        description,
        userId: user.id,
      },
    })

    // Mock response similar to Stripe's payment link creation
    const response = {
      id: mockPaymentIntentId,
      url: mockPaymentLink,
      payment_intent: mockPaymentIntentId,
      amount: payment.amount,
      currency: payment.currency,
      status: 'pending',
      created: Math.floor(Date.now() / 1000),
      metadata: {
        userId: user.id,
        description,
      },
    }

    return NextResponse.json({ paymentLink: response }, { status: 201 })
  } catch (error) {
    console.error('Error creating payment link:', error)
    
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 