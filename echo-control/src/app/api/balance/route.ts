import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/balance - Get user balance
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Calculate balance from payments and transactions
    const payments = await db.payment.aggregate({
      where: {
        userId,
        status: 'completed',
      },
      _sum: {
        amount: true,
      },
    })

    const transactions = await db.llmTransaction.aggregate({
      where: { userId },
      _sum: {
        cost: true,
      },
    })

    const totalCredits = (payments._sum.amount || 0) / 100 // Convert from cents
    const totalSpent = Number(transactions._sum.cost || 0)
    const balance = totalCredits - totalSpent

    return NextResponse.json({
      balance: balance.toFixed(2),
      totalCredits: totalCredits.toFixed(2),
      totalSpent: totalSpent.toFixed(2),
      currency: 'USD',
    })
  } catch (error) {
    console.error('Error fetching balance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/balance - Increment/Decrement balance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, operation, description } = body

    if (!userId || !amount || !operation) {
      return NextResponse.json(
        { error: 'User ID, amount, and operation are required' },
        { status: 400 }
      )
    }

    if (!['increment', 'decrement'].includes(operation)) {
      return NextResponse.json(
        { error: 'Operation must be increment or decrement' },
        { status: 400 }
      )
    }

    const amountInCents = Math.round(Math.abs(amount) * 100)

    if (operation === 'increment') {
      // Add credits via payment record
      await db.payment.create({
        data: {
          stripePaymentId: `manual_${Date.now()}_${userId}`,
          amount: amountInCents,
          currency: 'usd',
          status: 'completed',
          description: description || 'Manual credit adjustment',
          userId,
        },
      })
    } else {
      // Deduct credits via LLM transaction record
      await db.llmTransaction.create({
        data: {
          model: 'manual-adjustment',
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          cost: amount,
          status: 'success',
          prompt: description || 'Manual debit adjustment',
          userId,
        },
      })
    }

    // Return updated balance
    const payments = await db.payment.aggregate({
      where: {
        userId,
        status: 'completed',
      },
      _sum: {
        amount: true,
      },
    })

    const transactions = await db.llmTransaction.aggregate({
      where: { userId },
      _sum: {
        cost: true,
      },
    })

    const totalCredits = (payments._sum.amount || 0) / 100
    const totalSpent = Number(transactions._sum.cost || 0)
    const balance = totalCredits - totalSpent

    return NextResponse.json({
      success: true,
      operation,
      amount: amount.toFixed(2),
      balance: balance.toFixed(2),
      totalCredits: totalCredits.toFixed(2),
      totalSpent: totalSpent.toFixed(2),
      currency: 'USD',
    })
  } catch (error) {
    console.error('Error updating balance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 