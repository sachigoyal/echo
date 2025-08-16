'use client';

import React, { useState } from 'react';
import { useCurrentApp } from '@/hooks/useCurrentApp';
import { useUpdateApp } from '@/hooks/useUpdateApp';
import MarkupSettingsCard from '../MarkupSettingsCard';
import ReferralRewardCard from '../ReferralRewardCard';
import GithubSelection from './GithubSelection';
import { AppGithubLink } from '@/lib/apps/types';

interface GeneralSettingsProps {
  appId: string;
}

export default function GeneralSettings({ appId }: GeneralSettingsProps) {
  // Local loading states for different operations
  const [isUpdatingPublic, setIsUpdatingPublic] = useState(false);
  const [isUpdatingGithub, setIsUpdatingGithub] = useState(false);

  // Use the custom hooks - rename to avoid naming conflict
  const {
    app,
    isLoading: appLoading,
    error: appError,
    updateApp: updateLocalApp,
  } = useCurrentApp(appId);
  const {
    updateApp: updateRemoteApp,
    error: updateError,
    clearError,
  } = useUpdateApp();

  const updatePublicStatus = async (newPublicStatus: boolean) => {
    try {
      setIsUpdatingPublic(true);
      clearError();

      await updateRemoteApp(appId, {
        isPublic: newPublicStatus,
      });

      // Update local state after successful API call
      updateLocalApp({ isPublic: newPublicStatus });
    } catch (error) {
      console.error('Error updating public status:', error);
      // Error is already handled by the useUpdateApp hook
    } finally {
      setIsUpdatingPublic(false);
    }
  };

  const updateGitHubInfo = async (
    newGithubId: string | undefined,
    newGithubType: 'user' | 'repo' | undefined
  ) => {
    try {
      setIsUpdatingGithub(true);
      clearError();

      await updateRemoteApp(appId, {
        githubId: newGithubId,
        githubType: newGithubType,
      });

      // Update local state after successful API call only if values are defined
      if (newGithubId !== undefined && newGithubType !== undefined) {
        const githubLink: AppGithubLink = {
          githubId: newGithubId,
          githubType: newGithubType,
          isArchived: false,
          description: '',
        };

        updateLocalApp({
          githubLink,
        });
      }
    } catch (error) {
      console.error('Error updating GitHub info:', error);
      // Error is already handled by the useUpdateApp hook
    } finally {
      setIsUpdatingGithub(false);
    }
  };

  // Show loading state while app is loading
  if (appLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">General Settings</h3>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            Loading app details...
          </div>
        </div>
      </div>
    );
  }

  // Show error state if app failed to load
  if (appError || !app) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">General Settings</h3>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            {appError || 'Failed to load app details'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">General Settings</h3>
      </div>

      {/* Markup Settings */}
      <div>
        <MarkupSettingsCard appId={appId} appName={app.name} />
      </div>

      {/* Referral Reward Settings */}
      <div>
        <ReferralRewardCard appId={appId} appName={app.name} />
      </div>

      {/* GitHub User Settings */}
      <div>
        <GithubSelection
          initialGithubId={app.githubLink?.githubId || ''}
          initialGithubType={
            app.githubLink?.githubType as 'user' | 'repo' | null
          }
          onSave={updateGitHubInfo}
          isLoading={isUpdatingGithub}
          error={updateError}
        />
      </div>

      {/* App ID Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">
              App ID
            </h4>
            <div className="bg-muted/30 rounded-lg p-3">
              <code className="text-sm font-mono text-muted-foreground">
                {appId}
              </code>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Your unique app identifier. This cannot be changed.
            </p>
          </div>
        </div>
      </div>

      {/* Public Settings */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">
              Public Visibility
            </label>
            <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">
                  Make app publicly discoverable
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  When enabled, your app will be visible to all users and appear
                  in the public app directory
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isUpdatingPublic && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                )}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={app.isPublic}
                    onChange={e => updatePublicStatus(e.target.checked)}
                    disabled={isUpdatingPublic}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
            {updateError && (
              <p className="text-sm text-destructive bg-destructive/10 p-2 rounded mt-2">
                {updateError}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
