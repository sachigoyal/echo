import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/stripe/payment-link - Generate payment link (mocked)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, description = 'Echo Credits' } = body

    if (!userId || !amount) {
      return NextResponse.json({ error: 'User ID and amount are required' }, { status: 400 })
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
        userId,
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
        userId,
        description,
      },
    }

    return NextResponse.json({ paymentLink: response }, { status: 201 })
  } catch (error) {
    console.error('Error creating payment link:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 