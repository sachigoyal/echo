'use client';

import { useState } from 'react';
import { XIcon } from 'lucide-react';

interface EchoApp {
  id: string;
  name: string;
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
  const [confirmationInput, setConfirmationInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const getRequiredConfirmationText = (appName: string) => {
    return `I confirm I want to delete ${appName}`;
  };

  const handleConfirm = async () => {
    if (!app) return;

    const requiredText = getRequiredConfirmationText(app.name);
    if (confirmationInput !== requiredText) {
      setError('Confirmation text does not match');
      return;
    }

    setError(null);
    try {
      await onConfirm(app.id);
      handleClose();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to delete application'
      );
    }
  };

  const handleClose = () => {
    setConfirmationInput('');
    setError(null);
    onClose();
  };

  const isConfirmationValid =
    app && confirmationInput === getRequiredConfirmationText(app.name);

  if (!isOpen || !app) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 rounded-2xl border border-gray-700/50 backdrop-blur-sm p-6 w-full max-w-md">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              Delete Application
            </h3>
            <p className="text-sm text-gray-400">
              This action cannot be undone
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/50 transition-all duration-300"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-300 mb-4">
            You are about to delete the application{' '}
            <span className="font-semibold text-white">
              &ldquo;{app.name}&rdquo;
            </span>
            . This will permanently remove the application and all associated
            data.
          </p>

          <p className="text-sm text-gray-400 mb-3">
            To confirm, please type the following text exactly:
          </p>

          <div className="bg-gray-800/50 rounded-lg p-3 mb-3 border border-gray-600/50">
            <code className="text-sm text-gray-300 font-mono break-all">
              {getRequiredConfirmationText(app.name)}
            </code>
          </div>

          <input
            type="text"
            value={confirmationInput}
            onChange={e => setConfirmationInput(e.target.value)}
            placeholder="Type the confirmation text..."
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all duration-300"
            autoFocus
          />
        </div>

        {error && (
          <div className="mb-4 bg-gradient-to-r from-red-900/50 to-red-800/30 border border-red-500/50 rounded-lg p-3">
            <div className="text-sm text-red-300">{error}</div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/70 transition-all duration-300"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isConfirmationValid || isDeleting}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600/80 to-red-700/80 border border-red-500/50 rounded-lg text-white hover:from-red-600 hover:to-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isDeleting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              'Delete Application'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
