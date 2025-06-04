import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserByApiKey } from '@/lib/auth'

// Helper function to get user from API key
async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authentication required')
  }

  // API key authentication required for this endpoint
  const authResult = await getCurrentUserByApiKey(request)
  return { user: authResult.user, echoApp: authResult.echoApp }
}

// POST /api/transactions - Create a new LLM transaction
export async function POST(request: NextRequest) {
  try {
    const { user, echoApp } = await getAuthenticatedUser(request)
    const body = await request.json()
    const { 
      model, 
      inputTokens, 
      outputTokens, 
      totalTokens, 
      cost, 
      prompt, 
      response, 
      status = 'success',
      errorMessage 
    } = body

    // Validate required fields
    if (!model || typeof inputTokens !== 'number' || typeof outputTokens !== 'number' || 
        typeof totalTokens !== 'number' || typeof cost !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: model, inputTokens, outputTokens, totalTokens, cost' },
        { status: 400 }
      )
    }

    // Create the LLM transaction
    const transaction = await db.llmTransaction.create({
      data: {
        model,
        inputTokens,
        outputTokens,
        totalTokens,
        cost,
        prompt: prompt || null,
        response: response || null,
        status,
        errorMessage: errorMessage || null,
        userId: user.id,
        echoAppId: echoApp.id,
      },
    })

    return NextResponse.json({ 
      transaction: {
        id: transaction.id,
        model: transaction.model,
        inputTokens: transaction.inputTokens,
        outputTokens: transaction.outputTokens,
        totalTokens: transaction.totalTokens,
        cost: transaction.cost,
        status: transaction.status,
        createdAt: transaction.createdAt,
        userId: transaction.userId,
        echoAppId: transaction.echoAppId,
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)
    
    if (error instanceof Error && (error.message === 'Not authenticated' || error.message.includes('Invalid'))) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 