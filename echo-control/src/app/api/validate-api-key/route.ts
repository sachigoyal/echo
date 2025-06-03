import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/auth'

// POST /api/validate-api-key - Validate an API key for external services
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiKey } = body

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    const validationResult = await validateApiKey(apiKey)

    if (!validationResult) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Invalid or inactive API key'
        },
        { status: 401 }
      )
    }

    return NextResponse.json({
      valid: true,
      userId: validationResult.userId,
      echoAppId: validationResult.echoAppId,
      user: {
        id: validationResult.user.id,
        email: validationResult.user.email,
        name: validationResult.user.name
      },
      echoApp: {
        id: validationResult.echoApp.id,
        name: validationResult.echoApp.name,
        description: validationResult.echoApp.description,
        isActive: validationResult.echoApp.isActive
      }
    })
  } catch (error) {
    console.error('Error validating API key:', error)
    return NextResponse.json(
      { 
        valid: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
} 