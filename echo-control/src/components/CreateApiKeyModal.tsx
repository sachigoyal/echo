'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { GlassButton } from './glass-button';

interface CreateApiKeyModalProps {
  echoAppId: string;
  onClose: () => void;
  onSubmit: (data: { name: string; echoAppId: string }) => Promise<void>;
}

export default function CreateApiKeyModal({
  echoAppId,
  onClose,
  onSubmit,
}: CreateApiKeyModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        echoAppId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key');
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = async () => {
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        echoAppId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/75 backdrop-blur-sm overflow-y-auto h-full w-full z-50 fade-in">
      <div className="relative top-20 mx-auto p-5 border border-border w-96 shadow-lg rounded-md bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-card-foreground">
            Create New API Key
          </h3>
          <button onClick={onClose} className="!h-8 !w-8">
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-destructive/20 border border-destructive rounded-md p-3">
            <div className="text-sm text-destructive-foreground">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-card-foreground"
            >
              API Key Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-input bg-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-input-foreground placeholder-muted-foreground transition-colors"
              placeholder="Production API Key"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-md hover:bg-accent text-foreground"
            >
              Cancel
            </button>
            <GlassButton
              onClick={handleButtonClick}
              disabled={!name.trim() || loading}
              variant="primary"
            >
              {loading ? 'Creating...' : 'Create API Key'}
            </GlassButton>
          </div>
        </form>
      </div>
    </div>
  );
}
