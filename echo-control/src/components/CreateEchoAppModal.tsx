'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { GlassButton } from './glass-button';

interface CreateEchoAppModalProps {
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    githubType?: 'user' | 'repo';
    githubId?: string;
  }) => Promise<void>;
}

export default function CreateEchoAppModal({
  onClose,
  onSubmit,
}: CreateEchoAppModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [githubType, setGithubType] = useState<'user' | 'repo'>('user');
  const [githubId, setGithubId] = useState('');
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
        githubType: githubId.trim() ? githubType : undefined,
        githubId: githubId.trim() || undefined,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create echo app'
      );
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
        description: description.trim() || undefined,
        githubType: githubId.trim() ? githubType : undefined,
        githubId: githubId.trim() || undefined,
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

          <div>
            <label
              htmlFor="githubType"
              className="block text-sm font-medium text-card-foreground"
            >
              GitHub Type
            </label>
            <select
              id="githubType"
              value={githubType}
              onChange={e => setGithubType(e.target.value as 'user' | 'repo')}
              className="mt-1 block w-full px-3 py-2 border border-input bg-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-input-foreground transition-colors"
            >
              <option value="user">User</option>
              <option value="repo">Repository</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="githubId"
              className="block text-sm font-medium text-card-foreground"
            >
              GitHub ID
            </label>
            <input
              type="text"
              id="githubId"
              value={githubId}
              onChange={e => setGithubId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-input bg-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-input-foreground placeholder-muted-foreground transition-colors"
              placeholder={
                githubType === 'user' ? 'username' : 'owner/repo-name'
              }
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {githubType === 'user'
                ? 'Enter the GitHub username (e.g., octocat)'
                : 'Enter the repository path (e.g., owner/repo-name)'}
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <GlassButton onClick={onClose} variant="secondary">
              Cancel
            </GlassButton>
            <GlassButton
              onClick={handleButtonClick}
              disabled={!name.trim() || loading}
              variant="primary"
            >
              {loading ? 'Creating...' : 'Create App'}
            </GlassButton>
          </div>
        </form>
      </div>
    </div>
  );
}
