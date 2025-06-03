import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/echo-apps/[id] - Get echo app details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const echoApp = await db.echoApp.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        apiKeys: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
        llmTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        _count: {
          select: {
            apiKeys: true,
            llmTransactions: true,
          },
        },
      },
    })

    if (!echoApp) {
      return NextResponse.json({ error: 'Echo app not found' }, { status: 404 })
    }

    // Calculate usage statistics
    const stats = await db.llmTransaction.aggregate({
      where: { echoAppId: id },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        cost: true,
      },
      _count: true,
    })

    // Get usage by model
    const modelUsage = await db.llmTransaction.groupBy({
      by: ['model'],
      where: { echoAppId: id },
      _sum: {
        totalTokens: true,
        cost: true,
      },
      _count: true,
    })

    // Get recent transactions
    const recentTransactions = await db.llmTransaction.findMany({
      where: { echoAppId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        model: true,
        totalTokens: true,
        cost: true,
        status: true,
        createdAt: true,
      },
    })

    const appWithStats = {
      ...echoApp,
      stats: {
        totalTransactions: stats._count,
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/echo-apps/[id] - Update echo app
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, description, isActive } = body

    const echoApp = await db.echoApp.update({
      where: { id },
      data: {
        name,
        description,
        isActive,
      },
      include: {
        apiKeys: true,
        _count: {
          select: {
            apiKeys: true,
            llmTransactions: true,
          },
        },
      },
    })

    return NextResponse.json({ echoApp })
  } catch (error) {
    console.error('Error updating echo app:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 