import { useState, useCallback, useEffect } from 'react';
import { useUpdateApp } from '../../../hooks/useUpdateApp';

export interface UseCallbackUrlComponentReturn {
  callbackUrl: string;
  setCallbackUrl: (url: string) => void;
  update: () => Promise<void>;
  canGoNext: boolean;
  isUpdating: boolean;
  error: string | null;
}

export function useCallbackUrlComponent(
  appId: string,
  initialCallbackUrl: string = ''
): UseCallbackUrlComponentReturn {
  const [callbackUrl, setCallbackUrl] = useState(initialCallbackUrl);
  const { updateApp, isUpdating, error } = useUpdateApp();

  // Update callbackUrl when initialCallbackUrl changes
  useEffect(() => {
    setCallbackUrl(initialCallbackUrl);
  }, [initialCallbackUrl]);

  const isValidUrl = useCallback((url: string): boolean => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }, []);

  // Validation logic
  const canGoNext = (() => {
    // Optional field - can proceed if empty
    if (!callbackUrl.trim()) return true;
    // If value provided, must be valid URL
    return isValidUrl(callbackUrl.trim()) && !isUpdating;
  })();

  // Update method that performs the app update
  const handleCallbackUrlUpdate = useCallback(async (): Promise<void> => {
    if (!canGoNext) {
      throw new Error('Cannot proceed: Invalid callback URL');
    }

    try {
      const urls = callbackUrl.trim() ? [callbackUrl.trim()] : [];
      await updateApp(appId, { authorizedCallbackUrls: urls });
    } catch (error) {
      throw error; // Re-throw to be handled by navigation hook
    }
  }, [canGoNext, callbackUrl, updateApp, appId]);

  return {
    callbackUrl,
    setCallbackUrl,
    update: handleCallbackUrlUpdate,
    canGoNext,
    isUpdating,
    error,
  };
}
