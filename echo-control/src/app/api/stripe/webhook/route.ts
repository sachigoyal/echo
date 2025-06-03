import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/stripe/webhook - Handle Stripe webhooks (mocked)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Mock webhook signature verification
    const signature = request.headers.get('stripe-signature')
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Mock processing different event types
    const { type, data } = body

    switch (type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(data.object)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(data.object)
        break
      case 'invoice.payment_succeeded':
        await handleInvoicePayment(data.object)
        break
      default:
        console.log(`Unhandled event type: ${type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handlePaymentSuccess(paymentIntent: any) {
  try {
    const { id, amount, currency, metadata } = paymentIntent
    const userId = metadata?.userId

    if (!userId) {
      console.error('No userId in payment metadata')
      return
    }

    // Update payment in database
    await db.payment.upsert({
      where: { stripePaymentId: id },
      update: { status: 'completed' },
      create: {
        stripePaymentId: id,
        amount,
        currency,
        status: 'completed',
        description: 'Echo credits purchase',
        userId,
      },
    })

    console.log(`Payment succeeded: ${id}`)
  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}

async function handlePaymentFailure(paymentIntent: any) {
  try {
    const { id } = paymentIntent

    await db.payment.updateMany({
      where: { stripePaymentId: id },
      data: { status: 'failed' },
    })

    console.log(`Payment failed: ${id}`)
  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}

async function handleInvoicePayment(invoice: any) {
  try {
    const { id, amount_paid, currency, customer } = invoice
    
    // Mock handling of recurring payments
    console.log(`Invoice payment received: ${id} for ${amount_paid} ${currency}`)
  } catch (error) {
    console.error('Error handling invoice payment:', error)
  }
} 