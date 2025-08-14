'use client';

import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Gift, Percent, AlertCircle, Check, CheckIcon } from 'lucide-react';
import { Separator } from './ui/separator';
import { api } from '@/trpc/client';
import { GlassButton } from './glass-button';

interface ReferralRewardCardProps {
  appId: string;
  appName: string;
}

export default function ReferralRewardCard({
  appId,
  appName,
}: ReferralRewardCardProps) {
  const [rewardAmount, setRewardAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Query to get current referral reward
  const {
    data: currentReferralReward,
    isLoading: isLoadingReward,
    refetch,
  } = api.user.referral.getCurrentReferralReward.useQuery({
    echoAppId: appId,
  });

  const setReferralRewardMutation =
    api.user.referral.setAppReferralReward.useMutation({
      onSuccess: () => {
        setSuccess(true);
        setError(null);
        refetch(); // Refetch the current reward
        setTimeout(() => setSuccess(false), 3000);
      },
      onError: error => {
        setError(error.message || 'Failed to set referral reward');
        setSuccess(false);
      },
    });

  const handleSave = async () => {
    const percentage = parseFloat(rewardAmount);

    if (isNaN(percentage) || percentage < 1) {
      setError('Reward percentage must be 1% or higher');
      return;
    }

    if (percentage > 1000) {
      setError('Reward percentage cannot exceed 1000%');
      return;
    }

    setError(null);
    setReferralRewardMutation.mutate({
      echoAppId: appId,
      reward: percentage,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRewardAmount(value);
    setError(null);
    setSuccess(false);
  };

  const currentPercentage = parseFloat(rewardAmount) || 0;
  const currentRewardPercentage = currentReferralReward?.amount || 0;
  const isChanged = currentPercentage !== currentRewardPercentage;
  const isLoading = setReferralRewardMutation.isPending || isLoadingReward;

  // Set initial value when currentReferralReward is loaded
  useEffect(() => {
    if (currentReferralReward && rewardAmount === '') {
      setRewardAmount(currentReferralReward.amount.toString());
    }
  }, [currentReferralReward, rewardAmount]);

  // Show loading state while fetching current reward
  if (isLoadingReward) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-foreground">
              Referral Reward
            </h4>
            <p className="text-sm text-muted-foreground">
              Set the reward percentage for successful referrals to {appName}
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label htmlFor="reward-percentage" className="text-sm font-medium">
            Reward Percentage (%)
          </Label>
          <div className="relative">
            <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="reward-percentage"
              type="number"
              step="1"
              min="1"
              max="1000"
              value={rewardAmount}
              onChange={handleInputChange}
              placeholder="5"
              className="pl-10 pr-8"
              disabled={isLoading}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
              %
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Percentage bonus that users will receive when their referral signs
            up
          </p>

          {/* Quick Presets */}
          <div className="flex space-x-2">
            {[5, 10, 25, 50].map(preset => (
              <button
                key={preset}
                onClick={() => {
                  setRewardAmount(preset.toString());
                  setError(null);
                  setSuccess(false);
                }}
                disabled={isLoading}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPercentage === preset
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground disabled:opacity-50'
                }`}
              >
                {preset}%
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-300">
              Referral reward updated successfully!
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-muted-foreground">
            {currentReferralReward && (
              <>Current reward: {currentRewardPercentage}%</>
            )}
          </div>
          <GlassButton
            onClick={handleSave}
            disabled={isLoading || !isChanged}
            variant={
              success ? 'secondary' : isChanged ? 'primary' : 'secondary'
            }
          >
            {isLoading ? (
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
      </div>
    </Card>
  );
}
