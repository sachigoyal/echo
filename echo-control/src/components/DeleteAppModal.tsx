'use client';

import { useState } from 'react';
import { XIcon } from 'lucide-react';
import { GlassButton } from './glass-button';

interface EchoApp {
  id: string;
  name: string;
  description?: string;
}

interface DeleteAppModalProps {
  isOpen: boolean;
  app: EchoApp | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: (appId: string) => Promise<void>;
}

export default function DeleteAppModal({
  isOpen,
  app,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteAppModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setConfirmText('');
    setError(null);
    onClose();
  };

  const handleConfirm = async () => {
    if (!app) return;

    if (confirmText !== app.name) {
      setError('Application name does not match');
      return;
    }

    try {
      setError(null);
      await onConfirm(app.id);
      handleClose();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to archive app'
      );
    }
  };

  if (!isOpen || !app) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl backdrop-blur-sm p-6 w-full max-w-md">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              Delete Application
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              This action cannot be undone
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all duration-300"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-700 dark:text-red-300">
              <strong>Warning:</strong> Deleting &quot;{app.name}&quot; will
              permanently remove all API keys, analytics data, and user access.
              This action cannot be undone.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              Type the application name to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder={app.name}
              className="w-full px-4 py-3 bg-input border border-border rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all duration-300"
              disabled={isDeleting}
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <GlassButton
              onClick={handleClose}
              variant="secondary"
              className="flex-1"
              disabled={isDeleting}
            >
              Cancel
            </GlassButton>
            <GlassButton
              onClick={handleConfirm}
              variant="primary"
              className="flex-1 bg-red-600 hover:bg-red-700 border-red-600"
              disabled={isDeleting || confirmText !== app.name}
            >
              {isDeleting ? 'Deleting...' : 'Delete Application'}
            </GlassButton>
          </div>
        </div>
      </div>
    </div>
  );
}
