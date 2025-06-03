import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/echo-apps - List echo apps for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const echoApps = await db.echoApp.findMany({
      where: { userId },
      include: {
        apiKeys: {
          where: { isActive: true },
          select: { id: true, name: true, createdAt: true },
        },
        llmTransactions: {
          select: { id: true, totalTokens: true, cost: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            apiKeys: true,
            llmTransactions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate total usage and costs for each app
    const appsWithStats = await Promise.all(
      echoApps.map(async (app) => {
        const stats = await db.llmTransaction.aggregate({
          where: { echoAppId: app.id },
          _sum: {
            totalTokens: true,
            cost: true,
          },
        })

        return {
          ...app,
          totalTokens: stats._sum.totalTokens || 0,
          totalCost: stats._sum.cost || 0,
        }
      })
    )

    return NextResponse.json({ echoApps: appsWithStats })
  } catch (error) {
    console.error('Error fetching echo apps:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/echo-apps - Create a new echo app
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, description } = body

    if (!userId || !name) {
      return NextResponse.json({ error: 'User ID and name are required' }, { status: 400 })
    }

    // Check if user exists first
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      // If user doesn't exist, create it with mock data for development
      console.log(`User ${userId} not found, creating mock user for development`)
      await db.user.create({
        data: {
          id: userId,
          email: `${userId}@example.com`,
          name: 'Mock User',
        }
      })
    }

    const echoApp = await db.echoApp.create({
      data: {
        name,
        description: description || null,
        userId,
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

    return NextResponse.json({ echoApp }, { status: 201 })
  } catch (error) {
    console.error('Error creating echo app:', error)
    
    // Check if it's a foreign key constraint error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return NextResponse.json({ 
        error: 'User not found. Please ensure the user exists before creating an echo app.' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 