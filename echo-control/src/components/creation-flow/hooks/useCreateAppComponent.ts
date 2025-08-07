import { useCallback, useRef } from 'react';
import { useCreateApp } from '../../../hooks/useCreateApp';
import { CreateApplicationStepRef } from '../CreateApplicationStep';
import { useUpdateApp } from '@/hooks/useUpdateApp';
import { OwnerEchoApp } from '@/lib/apps/types';

export interface UseCreateAppComponentReturn {
  stepRef: React.RefObject<CreateApplicationStepRef | null>;
  update: () => Promise<OwnerEchoApp>;
  canGoNext: boolean;
  isCreating: boolean;
  error: string | null;
}

export function useCreateAppComponent(
  existingAppId?: string,
  onAppCreated?: (app: OwnerEchoApp) => void
): UseCreateAppComponentReturn {
  const stepRef = useRef<CreateApplicationStepRef>(null);
  const { createApp, isCreating, error: createError } = useCreateApp();
  const { updateApp, isUpdating, error: updateError } = useUpdateApp();

  const error = createError || updateError;

  // Validation logic - check if we can proceed
  const canGoNext = !isCreating && !isUpdating;

  // Update method that performs the app creation
  const handleCreateAppComponent =
    useCallback(async (): Promise<OwnerEchoApp> => {
      const appName = stepRef.current?.getValue() || '';

      if (!appName.trim()) {
        throw new Error('Cannot proceed: App name is required');
      }

      if (isCreating) {
        throw new Error('Cannot proceed: Already creating app');
      }

      try {
        if (existingAppId) {
          await updateApp(existingAppId, {
            name: appName.trim(),
          });
          // For updates, we need to return a DetailedEchoApp, but updateApp returns string
          // This is a limitation - we'd need to fetch the app or modify updateApp
          throw new Error(
            'Update flow not yet supported with new optimistic approach'
          );
        } else {
          const createdApp = await createApp({ name: appName.trim() });
          // Notify parent component of the created app data
          if (onAppCreated) {
            onAppCreated(createdApp);
          }
          return createdApp;
        }
      } catch (error) {
        throw error; // Re-throw to be handled by navigation hook
      }
    }, [createApp, updateApp, existingAppId, isCreating, onAppCreated]);

  return {
    stepRef,
    update: handleCreateAppComponent,
    canGoNext,
    isCreating,
    error,
  };
}
