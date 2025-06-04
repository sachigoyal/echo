import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth'

// GET /api/echo-apps/[id] - Get detailed app information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, echoApp, isApiKeyAuth } = await getAuthenticatedUser(request)
    const { id: appId } = await params

    // If using API key auth, ensure they can only access their scoped app
    if (isApiKeyAuth && echoApp && echoApp.id !== appId) {
      return NextResponse.json({ error: 'Access denied: API key not scoped to this app' }, { status: 403 })
    }

    // Find the echo app
    const app = await db.echoApp.findFirst({
      where: {
        id: appId,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        apiKeys: {
          select: {
            id: true,
            name: true,
            key: true,
            isActive: true,
            createdAt: true,
            lastUsed: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!app) {
      return NextResponse.json({ error: 'Echo app not found or access denied' }, { status: 404 })
    }

    // Get transaction statistics
    const stats = await db.llmTransaction.aggregate({
      where: { echoAppId: appId },
      _sum: {
        totalTokens: true,
        inputTokens: true,
        outputTokens: true,
        cost: true,
      },
      _count: true,
    })

    // Get model usage breakdown
    const modelUsage = await db.llmTransaction.groupBy({
      by: ['model'],
      where: { echoAppId: appId },
      _sum: {
        totalTokens: true,
        cost: true,
      },
      _count: true,
      orderBy: {
        _sum: {
          cost: 'desc',
        },
      },
    })

    // Get recent transactions
    const recentTransactions = await db.llmTransaction.findMany({
      where: { echoAppId: appId },
      select: {
        id: true,
        model: true,
        totalTokens: true,
        cost: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const appWithStats = {
      ...app,
      stats: {
        totalTransactions: stats._count || 0,
        totalTokens: stats._sum.totalTokens || 0,
        totalInputTokens: stats._sum.inputTokens || 0,
        totalOutputTokens: stats._sum.outputTokens || 0,
        totalCost: stats._sum.cost || 0,
        modelUsage,
      },
      recentTransactions,
    }

    return NextResponse.json({ echoApp: appWithStats })
  } catch (error) {
    console.error('Error fetching echo app:', error)
    
    if (error instanceof Error && (error.message === 'Not authenticated' || error.message.includes('Invalid'))) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/echo-apps/[id] - Update app information
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, echoApp, isApiKeyAuth } = await getAuthenticatedUser(request)
    const { id: appId } = params

    // API key users cannot update apps
    if (isApiKeyAuth) {
      return NextResponse.json({ error: 'API key authentication cannot update apps' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, isActive } = body

    // Verify the echo app exists and belongs to the user
    const existingApp = await db.echoApp.findFirst({
      where: {
        id: appId,
        userId: user.id,
      },
    })

    if (!existingApp) {
      return NextResponse.json({ error: 'Echo app not found or access denied' }, { status: 404 })
    }

    // Update the app
    const updatedApp = await db.echoApp.update({
      where: { id: appId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        apiKeys: {
          select: {
            id: true,
            name: true,
            isActive: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            apiKeys: true,
            llmTransactions: true,
          },
        },
      },
    })

    return NextResponse.json({ echoApp: updatedApp })
  } catch (error) {
    console.error('Error updating echo app:', error)
    
    if (error instanceof Error && (error.message === 'Not authenticated' || error.message.includes('Invalid'))) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/echo-apps/[id] - Delete an echo app
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, echoApp, isApiKeyAuth } = await getAuthenticatedUser(request)
    const { id: appId } = await params

    // API key users cannot delete apps
    if (isApiKeyAuth) {
      return NextResponse.json({ error: 'API key authentication cannot delete apps' }, { status: 403 })
    }

    // Verify the echo app exists and belongs to the user
    const existingApp = await db.echoApp.findFirst({
      where: {
        id: appId,
        userId: user.id,
      },
    })

    if (!existingApp) {
      return NextResponse.json({ error: 'Echo app not found or access denied' }, { status: 404 })
    }

    // First delete related API keys
    await db.apiKey.deleteMany({
      where: {
        echoAppId: appId,
      },
    })

    // Then delete related transactions
    await db.llmTransaction.deleteMany({
      where: {
        echoAppId: appId,
      },
    })

    // Finally delete the app itself
    await db.echoApp.delete({
      where: { id: appId },
    })

    return NextResponse.json({ success: true, message: 'Echo app and related data deleted successfully' })
  } catch (error) {
    console.error('Error deleting echo app:', error)
    
    if (error instanceof Error && (error.message === 'Not authenticated' || error.message.includes('Invalid'))) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 