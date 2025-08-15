import { useEffect } from 'react';
import { api } from '@/trpc/client';
import { toast } from 'sonner';

interface UseRegisterReferralCodeOptions {
  appId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Custom hook to handle referral code registration from URL parameters.
 * Automatically checks for referralCode parameter in the URL and registers it for the given app.
 */
export function useRegisterReferralCode({
  appId,
  onSuccess,
  onError,
}: UseRegisterReferralCodeOptions) {
  const { mutateAsync: setUserReferrerForAppIfExists } =
    api.user.referral.setUserReferrerForAppIfExists.useMutation();

  useEffect(() => {
    const registerReferralCode = async () => {
      if (typeof window === 'undefined') return;

      const urlParams = new URLSearchParams(window.location.search);
      const referralCode = urlParams.get('referralCode');

      if (referralCode) {
        try {
          const result = await setUserReferrerForAppIfExists({
            echoAppId: appId,
            code: referralCode,
          });

          // Clean up URL parameter
          urlParams.delete('referralCode');
          window.history.replaceState(
            {},
            '',
            `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`
          );
          if (result) {
            toast.success('Referral code applied successfully!');
            onSuccess?.();
          } else {
            onError?.('Referral code is invalid');
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Failed to apply referral code';
          toast.error(errorMessage);
          onError?.(errorMessage);
        }
      }
    };

    registerReferralCode();
  }, [appId, setUserReferrerForAppIfExists, onSuccess, onError]);
}
