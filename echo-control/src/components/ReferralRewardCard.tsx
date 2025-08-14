'use client';

import { useState, useEffect } from 'react';
import { CheckIcon, Gift } from 'lucide-react';
import { GlassButton } from './glass-button';
import { api } from '@/trpc/client';

interface ReferralRewardCardProps {
  appId: string;
  appName: string;
}

export default function ReferralRewardCard({ appId }: ReferralRewardCardProps) {
  const [inputValue, setInputValue] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Convert multiplier to percentage
  const multiplierToPercentage = (multiplier: number): number => {
    return Math.max(0, (multiplier - 1) * 100);
  };

  // Convert percentage to multiplier
  const percentageToMultiplier = (percentage: number): number => {
    return percentage / 100 + 1;
  };

  // Query to get current referral reward
  const {
    data: currentReferralReward,
    isLoading: loading,
    error: queryError,
    refetch: refetchReferralReward,
  } = api.user.referral.getCurrentReferralReward.useQuery({
    echoAppId: appId,
  });

  const setReferralRewardMutation =
    api.user.referral.setAppReferralReward.useMutation();

  const handleSave = async () => {
    const newPercentage = parseFloat(inputValue);

    if (isNaN(newPercentage) || newPercentage < 0 || newPercentage > 1000) {
      return;
    }

    const newMultiplier = percentageToMultiplier(newPercentage);

    setReferralRewardMutation.mutate(
      {
        echoAppId: appId,
        reward: newMultiplier,
      },
      {
        onSuccess: () => {
          // Don't reset user interaction state after save
          // The component will sync with new data but preserve user's current input
          refetchReferralReward();
        },
      }
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setHasUserInteracted(true);
  };

  const handlePresetClick = (preset: number) => {
    setInputValue(preset.toString());
    setHasUserInteracted(true);
  };

  // Set initial value when currentReferralReward is loaded and convert from multiplier to percentage
  // Only update input value if user hasn't interacted with the component yet
  useEffect(() => {
    if (currentReferralReward && !isInitialized) {
      const percentage = multiplierToPercentage(
        Number(currentReferralReward.amount)
      );
      setInputValue(percentage.toString());
      setIsInitialized(true);
    }
  }, [currentReferralReward, isInitialized]);

  // Reset user interaction state when app changes
  useEffect(() => {
    setHasUserInteracted(false);
    setIsInitialized(false);
  }, [appId]);

  const currentPercentage = parseFloat(inputValue) || 0;
  const storedPercentage = currentReferralReward
    ? multiplierToPercentage(Number(currentReferralReward.amount))
    : 0;
  const isChanged = currentPercentage !== storedPercentage;
  const saving = setReferralRewardMutation.isPending;
  const success = setReferralRewardMutation.isSuccess;
  const error = setReferralRewardMutation.error?.message || queryError?.message;

  // Reset success state after a delay and sync with saved data
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setReferralRewardMutation.reset();
        // After successful save, reset user interaction to allow sync with server data
        setHasUserInteracted(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, setReferralRewardMutation]);

  // Sync input with server data when data changes and user hasn't interacted recently
  useEffect(() => {
    if (
      currentReferralReward &&
      isInitialized &&
      !hasUserInteracted &&
      !saving
    ) {
      const percentage = multiplierToPercentage(
        Number(currentReferralReward.amount)
      );
      const currentInputPercentage = parseFloat(inputValue) || 0;

      // Only sync if there's a meaningful difference (to avoid floating point precision issues)
      if (Math.abs(currentInputPercentage - percentage) > 0.01) {
        setInputValue(percentage.toString());
      }
    }
  }, [
    currentReferralReward,
    isInitialized,
    hasUserInteracted,
    saving,
    inputValue,
  ]);

  // Validation
  const hasValidationError =
    currentPercentage < 0 ||
    currentPercentage > 1000 ||
    isNaN(currentPercentage);
  const validationError = hasValidationError
    ? currentPercentage < 0
      ? 'Referral reward must be 0% or higher'
      : currentPercentage > 1000
        ? 'Referral reward cannot exceed 1000%'
        : 'Please enter a valid number'
    : null;

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Gift className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground">Referral Reward</h3>
            <p className="text-sm text-muted-foreground">
              This is the bonus multiplier that users will receive when their
              referral signs up.
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">
            {storedPercentage.toFixed(2)}%
          </div>
          <div className="text-xs text-muted-foreground">Current</div>
        </div>
      </div>

      {/* Input Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <input
              type="number"
              min="0"
              max="1000"
              step="1"
              value={inputValue}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-input bg-background text-foreground rounded-lg text-lg font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0"
              placeholder="Enter percentage (0-1000)"
            />
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground font-medium">
              %
            </span>
          </div>
          <GlassButton
            onClick={handleSave}
            disabled={saving || !isChanged || hasValidationError}
            variant={
              success
                ? 'secondary'
                : isChanged && !hasValidationError
                  ? 'primary'
                  : 'secondary'
            }
          >
            {saving ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                Saving
              </div>
            ) : success ? (
              <div className="flex items-center ">
                <CheckIcon className="h-4 w-4 mr-2" />
                Saved
              </div>
            ) : (
              'Save'
            )}
          </GlassButton>
        </div>

        {/* Quick Presets */}
        <div className="flex space-x-2">
          {[0, 25, 50, 100].map(preset => (
            <button
              key={preset}
              onClick={() => handlePresetClick(preset)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                currentPercentage === preset
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
              }`}
            >
              {preset}%
            </button>
          ))}
        </div>
      </div>

      {/* Status Messages */}
      {(validationError || error) && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <p className="text-sm text-destructive">{validationError || error}</p>
        </div>
      )}
    </div>
  );
}
