'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusIcon, CreditCardIcon, KeyIcon, ChartBarIcon } from 'lucide-react'
import CreateEchoAppModal from '@/components/CreateEchoAppModal'
import BalanceCard from '@/components/BalanceCard'

interface EchoApp {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  totalTokens: number
  totalCost: number
  _count: {
    apiKeys: number
    llmTransactions: number
  }
}

export default function EchoAppsDashboard() {
  const [echoApps, setEchoApps] = useState<EchoApp[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Mock user ID - in a real app, this would come from Clerk auth
  const mockUserId = 'user_mock_123'

  useEffect(() => {
    fetchEchoApps()
  }, [])

  const fetchEchoApps = async () => {
    try {
      setError(null)
      const response = await fetch(`/api/echo-apps?userId=${mockUserId}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch echo apps')
      }
      
      setEchoApps(data.echoApps || [])
    } catch (error) {
      console.error('Error fetching echo apps:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch echo apps')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateApp = async (appData: { name: string; description?: string }) => {
    setError(null)
    const response = await fetch('/api/echo-apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...appData, userId: mockUserId }),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create echo app')
    }
    
    await fetchEchoApps() // Refresh the list
    setShowCreateModal(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-destructive/20 border border-destructive rounded-md p-4">
          <div className="text-sm text-destructive-foreground">
            {error}
          </div>
        </div>
      )}

      {/* Balance and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BalanceCard userId={mockUserId} />
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create New App
            </button>
            <Link
              href="#payment"
              className="w-full flex items-center justify-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-muted-foreground bg-card hover:bg-accent hover:text-accent-foreground"
            >
              <CreditCardIcon className="h-4 w-4 mr-2" />
              Add Credits
            </Link>
          </div>
        </div>
      </div>

      {/* Echo Apps Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Your Echo Apps</h2>
          <span className="text-sm text-muted-foreground">{echoApps.length} apps</span>
        </div>

        {echoApps.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <ChartBarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-card-foreground">No Echo apps</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by creating your first Echo application.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Echo App
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {echoApps.map((app, index) => (
              <Link
                key={app.id}
                href={`/apps/${app.id}`}
                className="block bg-card rounded-lg border border-border hover:border-secondary group"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-card-foreground truncate group-hover:text-secondary">
                      {app.name}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        app.isActive
                          ? 'bg-secondary/20 text-secondary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {app.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {app.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {app.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center text-muted-foreground">
                        <KeyIcon className="h-4 w-4 mr-1" />
                        API Keys
                      </div>
                      <div className="font-semibold text-card-foreground">
                        {app._count.apiKeys}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center text-muted-foreground">
                        <ChartBarIcon className="h-4 w-4 mr-1" />
                        Transactions
                      </div>
                      <div className="font-semibold text-card-foreground">
                        {app._count.llmTransactions.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Total Cost:</span>
                      <span className="font-semibold text-card-foreground">
                        ${Number(app.totalCost).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span className="text-muted-foreground">Total Tokens:</span>
                      <span className="font-semibold text-card-foreground">
                        {app.totalTokens.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create App Modal */}
      {showCreateModal && (
        <CreateEchoAppModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateApp}
        />
      )}
    </div>
  )
} 