'use client';

import { useEffect, useState } from 'react';
import ApiKeyModal from './ApiKeyModal';
import CreateApiKeyModal from './CreateApiKeyModal';
import { AppRole, Permission } from '@/lib/permissions/types';
import { useEchoAppDetail } from '@/hooks/useEchoAppDetail';
import { PublicAppDetail } from './app-detail/PublicAppDetail';
import { CustomerAppDetail } from './app-detail/CustomerAppDetail';
import { OwnerAppDetail } from './app-detail/OwnerAppDetail';
import { OwnerEchoApp, PublicEchoApp, CustomerEchoApp } from '@/lib/apps/types';
import { api } from '@/trpc/client';

interface EchoAppDetailProps {
  appId: string;
}

export default function EchoAppDetail({ appId }: EchoAppDetailProps) {
  const { app, loading, error, userPermissions, refetch, hasPermission } =
    useEchoAppDetail(appId);

  const [showCreateApiKeyModal, setShowCreateApiKeyModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [newApiKey, setNewApiKey] = useState<{
    id: string;
    key: string;
    name: string;
  } | null>(null);
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  useEffect(() => {
    // Check for payment success in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      setShowPaymentSuccess(true);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const { mutateAsync: createApiKey } = api.user.apiKeys.create.useMutation();

  const handleCreateApiKey = async (data: {
    name: string;
    echoAppId: string;
  }) => {
    try {
      const result = await createApiKey(data);

      // Store the new API key for display in the modal
      setNewApiKey({
        id: result.id,
        key: result.key,
        name: result.name || 'New API Key',
      });

      // Close the create modal and show the key display modal
      setShowCreateApiKeyModal(false);
      setShowApiKeyModal(true);

      // Refresh app details to show the new key in the list
      await refetch();
    } catch (error) {
      console.error('Error creating API key:', error);
      throw error;
    }
  };

  const { mutateAsync: updateApiKey } = api.user.apiKeys.update.useMutation();

  const handleRenameApiKey = async (id: string, newName: string) => {
    try {
      await updateApiKey({ id, data: { name: newName } });

      await refetch(); // Refresh data
    } catch (error) {
      console.error('Error renaming API key:', error);
      throw error;
    }
  };

  const { mutateAsync: deleteApiKey } = api.user.apiKeys.delete.useMutation();

  const handleArchiveApiKey = async (id: string) => {
    setDeletingKeyId(id);
    try {
      await deleteApiKey(id);

      await refetch(); // Refresh data
    } catch (error) {
      console.error('Error archiving API key:', error);
    } finally {
      setDeletingKeyId(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Error state
  if (error || !app) {
    return (
      <div className="text-center py-12 fade-in">
        <h2 className="text-xl font-semibold text-foreground">App not found</h2>
        <p className="mt-2 text-muted-foreground">{error}</p>
      </div>
    );
  }

  // Route to the correct component based on user permissions
  const renderAppDetail = () => {
    // Public view for unauthenticated users or public role
    if (
      !userPermissions.isAuthenticated ||
      userPermissions.userRole === AppRole.PUBLIC
    ) {
      return <PublicAppDetail app={app as PublicEchoApp} />;
    }

    // Customer view for customers with limited access
    if (userPermissions.userRole === AppRole.CUSTOMER) {
      return (
        <CustomerAppDetail
          app={app as CustomerEchoApp}
          hasPermission={hasPermission}
          onCreateApiKey={() => setShowCreateApiKeyModal(true)}
          onArchiveApiKey={handleArchiveApiKey}
          deletingKeyId={deletingKeyId}
          showPaymentSuccess={showPaymentSuccess}
          onDismissPaymentSuccess={() => setShowPaymentSuccess(false)}
        />
      );
    }

    // Owner/Admin view with full access
    return (
      <OwnerAppDetail
        app={app as OwnerEchoApp}
        hasPermission={hasPermission}
        onCreateApiKey={() => setShowCreateApiKeyModal(true)}
        onArchiveApiKey={handleArchiveApiKey}
        deletingKeyId={deletingKeyId}
        showPaymentSuccess={showPaymentSuccess}
        onDismissPaymentSuccess={() => setShowPaymentSuccess(false)}
      />
    );
  };

  return (
    <>
      {renderAppDetail()}

      {/* Modals */}
      <div className="relative z-50">
        {showCreateApiKeyModal &&
          app &&
          (hasPermission(Permission.CREATE_API_KEYS) ||
            hasPermission(Permission.MANAGE_OWN_API_KEYS)) && (
            <CreateApiKeyModal
              echoAppId={app.id}
              onClose={() => setShowCreateApiKeyModal(false)}
              onSubmit={handleCreateApiKey}
            />
          )}

        {showApiKeyModal && newApiKey && (
          <ApiKeyModal
            apiKey={newApiKey}
            onClose={() => {
              setShowApiKeyModal(false);
              setNewApiKey(null);
            }}
            onRename={handleRenameApiKey}
          />
        )}
      </div>
    </>
  );
}
