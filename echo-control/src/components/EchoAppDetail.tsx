'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Key, Activity, CreditCard, ExternalLink, Plus } from 'lucide-react'

interface EchoAppDetailProps {
  appId: string
}

interface EchoApp {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  user: {
    id: string
    email: string
    name?: string
  }
  apiKeys: Array<{
    id: string
    name?: string
    key: string
    isActive: boolean
    createdAt: string
  }>
  stats: {
    totalTransactions: number
    totalTokens: number
    totalInputTokens: number
    totalOutputTokens: number
    totalCost: number
    modelUsage: Array<{
      model: string
      _sum: {
        totalTokens: number | null
        cost: number | null
      }
      _count: number
    }>
  }
  recentTransactions: Array<{
    id: string
    model: string
    totalTokens: number
    cost: number
    status: string
    createdAt: string
  }>
}

export default function EchoAppDetail({ appId }: EchoAppDetailProps) {
  const [app, setApp] = useState<EchoApp | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creatingApiKey, setCreatingApiKey] = useState(false)

  useEffect(() => {
    fetchAppDetails()
  }, [appId])

  const fetchAppDetails = async () => {
    try {
      const response = await fetch(`/api/echo-apps/${appId}`)
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || 'Failed to load app details')
        return
      }
      
      setApp(data.echoApp)
    } catch (error) {
      console.error('Error fetching app details:', error)
      setError('Failed to load app details')
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePaymentLink = async () => {
    // Mock function - in real app would generate Stripe payment link
    alert('Payment link generation would happen here')
  }

  const handleCreateApiKey = async () => {
    if (!app) return
    
    setCreatingApiKey(true)
    try {
      const response = await fetch(`/api/echo-apps/${app.id}/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `API Key ${app.apiKeys.length + 1}`,
        }),
      })
      
      if (response.ok) {
        await fetchAppDetails() // Refresh data
      }
    } catch (error) {
      console.error('Error creating API key:', error)
    } finally {
      setCreatingApiKey(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
      </div>
    )
  }

  if (error || !app) {
    return (
      <div className="text-center py-12 fade-in">
        <h2 className="text-xl font-semibold text-foreground">App not found</h2>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{app.name}</h1>
            {app.description && (
              <p className="text-muted-foreground">{app.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
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
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center space-x-3">
            <div className="rounded-full bg-secondary/20 p-2">
              <Activity className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Transactions</p>
              <p className="text-xl font-bold text-card-foreground">
                {app.stats.totalTransactions.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center space-x-3">
            <div className="rounded-full bg-secondary/20 p-2">
              <Key className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">API Keys</p>
              <p className="text-xl font-bold text-card-foreground">
                {app.apiKeys.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center space-x-3">
            <div className="rounded-full bg-secondary/20 p-2">
              <CreditCard className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Cost</p>
              <p className="text-xl font-bold text-card-foreground">
                ${app.stats.totalCost.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center space-x-3">
            <div className="rounded-full bg-secondary/20 p-2">
              <Activity className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Tokens</p>
              <p className="text-xl font-bold text-card-foreground">
                {app.stats.totalTokens.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* API Keys Section */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-card-foreground">API Keys</h2>
          <button
            onClick={handleCreateApiKey}
            disabled={creatingApiKey}
            className="flex items-center px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" /> 
            {creatingApiKey ? 'Creating...' : 'Create Key'}
          </button>
        </div>

        {app.apiKeys.length === 0 ? (
          <div className="text-center py-8">
            <Key className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-card-foreground">No API keys yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create an API key to start using this Echo App.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Prefix
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {app.apiKeys.map((apiKey) => (
                  <tr key={apiKey.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-card-foreground">
                      {apiKey.name || 'Unnamed Key'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-muted-foreground">
                      {apiKey.key.slice(0, 10)}...
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          apiKey.isActive
                            ? 'bg-secondary/20 text-secondary'
                            : 'bg-destructive/20 text-destructive'
                        }`}
                      >
                        {apiKey.isActive ? 'Active' : 'Revoked'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(apiKey.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-6">Recent Transactions</h2>
        
        {app.recentTransactions.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-card-foreground">No transactions yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Transactions will appear here once you start using your API.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Tokens
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {app.recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-card-foreground">
                      {transaction.model}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-card-foreground">
                      {transaction.totalTokens.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-card-foreground">
                      ${transaction.cost.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/20 text-secondary">
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Model Usage */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-6">Model Usage</h2>
        
        {app.stats.modelUsage.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-card-foreground">No model usage yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Model usage statistics will appear here once you start using your API.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Requests
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Tokens
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {app.stats.modelUsage.map((usage) => (
                  <tr key={usage.model} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-card-foreground">
                      {usage.model}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-card-foreground">
                      {usage._count.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-card-foreground">
                      {(usage._sum.totalTokens || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-card-foreground">
                      ${(usage._sum.cost || 0).toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
} 