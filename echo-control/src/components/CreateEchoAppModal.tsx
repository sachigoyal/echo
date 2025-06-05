'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface CreateEchoAppModalProps {
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string }) => Promise<void>;
}

export default function CreateEchoAppModal({
  onClose,
  onSubmit,
}: CreateEchoAppModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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
        description: description.trim() || undefined,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create echo app'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/75 backdrop-blur-sm overflow-y-auto h-full w-full z-50 fade-in">
      <div className="relative top-20 mx-auto p-5 border border-border w-96 shadow-lg rounded-md bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-card-foreground">
            Create New Echo App
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
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
              App Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-input bg-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-input-foreground placeholder-muted-foreground transition-colors"
              placeholder="My Echo App"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-card-foreground"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-input bg-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-input-foreground placeholder-muted-foreground transition-colors resize-none"
              placeholder="Describe what this app does..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-muted-foreground bg-card hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create App'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
