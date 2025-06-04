'use client'

import { useState } from 'react'
import { X, Copy, Check } from 'lucide-react'

interface ApiKeyModalProps {
  apiKey: {
    id: string
    key: string
    name: string
  }
  onClose: () => void
  onRename?: (id: string, newName: string) => Promise<void>
}

export default function ApiKeyModal({ apiKey, onClose, onRename }: ApiKeyModalProps) {
  const [copied, setCopied] = useState(false)
  const [keyName, setKeyName] = useState(apiKey.name)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey.key)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000) // Reset after 3 seconds
  }

  const handleRename = async () => {
    if (!onRename || keyName.trim() === apiKey.name) {
      setIsEditing(false)
      return
    }

    setLoading(true)
    try {
      await onRename(apiKey.id, keyName.trim())
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to rename API key:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-background/75 backdrop-blur-sm overflow-y-auto h-full w-full z-50 fade-in">
      <div className="relative top-20 mx-auto p-5 border border-border w-full max-w-md shadow-lg rounded-md bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-card-foreground">API Key Created</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="api-key-name" className="block text-sm font-medium text-card-foreground mb-1">
              API Key Name
            </label>
            {isEditing ? (
              <div className="flex space-x-2">
                <input
                  type="text"
                  id="api-key-name"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  disabled={loading}
                  className="flex-1 px-3 py-2 border border-input bg-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-input-foreground"
                  placeholder="Enter API key name"
                />
                <button
                  onClick={handleRename}
                  disabled={loading || !keyName.trim()}
                  className="px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between px-3 py-2 border border-border bg-muted rounded-md">
                <span className="text-card-foreground">{keyName}</span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-primary hover:text-primary/90 transition-colors"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              API Key
            </label>
            <div className="relative">
              <div className="flex items-center justify-between px-3 py-2 border border-border bg-muted rounded-md font-mono text-sm text-card-foreground break-all pr-12">
                {apiKey.key}
              </div>
              <button
                onClick={handleCopy}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="bg-muted/50 border border-border rounded-md p-3 text-sm text-muted-foreground">
            <p className="font-medium text-card-foreground mb-1">Important:</p>
            <p>This is the only time this API key will be shown. Please copy it now and keep it secure.</p>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
            >
              I've Saved My API Key
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 