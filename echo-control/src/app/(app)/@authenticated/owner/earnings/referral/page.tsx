'use client';

import { useMemo, useState } from 'react';

import { api } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/balance';
import { toast } from 'sonner';

export default function ReferralEarningsPage() {
  const utils = api.useUtils();
  const { data: earnings, isLoading: earningsLoading, error: earningsError, refetch } =
    api.user.payout.referral.get.useQuery();

  const { data: recipient, isLoading: recipientLoading } = api.user.githubLink.get.useQuery();
  const [username, setUsername] = useState<string>('');

  const setRecipient = api.user.githubLink.update.useMutation({
    onSuccess: () => {
      toast.success('Recipient GitHub updated');
      utils.user.githubLink.get.invalidate();
    },
    onError: err => toast.error(err.message || 'Failed to update recipient'),
  });

  const claimAll = api.user.payout.referral.claimAll.useMutation({
    onSuccess: res => {
      toast.success(`Created ${res.payouts.length} referral payout${res.payouts.length === 1 ? '' : 's'}.`);
      utils.user.payout.referral.get.invalidate();
      utils.user.payout.referral.pending.invalidate();
    },
    onError: err => {
      toast.error(err.message || 'Failed to claim referral rewards');
    },
  });

  const { data: pending, isLoading: pendingLoading, error: pendingError } =
    api.user.payout.referral.pending.useQuery();

  const hasClaimable = useMemo(
    () => earnings && Object.values(earnings.byApp).some(v => v > 0),
    [earnings]
  );

  const currentRecipientDisplay = recipient?.githubUrl
    ? recipient.githubUrl.split('/').slice(3).join('/')
    : 'Not set';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Referral Rewards</h1>
        <p className="text-muted-foreground">
          View and claim your referral rewards across all apps.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payout Recipient</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recipientLoading ? (
            <Skeleton className="h-8 w-40" />
          ) : (
            <div className="flex flex-col gap-3">
              <div className="text-sm text-muted-foreground">Current: {currentRecipientDisplay}</div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <Input
                  placeholder="github username (e.g. richardhendricks)"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full sm:w-80"
                />
                <Button
                  disabled={!username || setRecipient.isPending}
                  onClick={() =>
                    setRecipient.mutate({ type: 'user', url: `https://github.com/${username}` })
                  }
                >
                  {setRecipient.isPending ? 'Saving…' : 'Save Recipient'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available to Claim</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {earningsError ? (
            <div className="text-sm text-red-500">{earningsError.message}</div>
          ) : earningsLoading ? (
            <Skeleton className="h-8 w-40" />
          ) : earnings ? (
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {formatCurrency(earnings.total)}
              </div>
              <Button
                disabled={!hasClaimable || claimAll.isPending}
                onClick={() => claimAll.mutate()}
              >
                {claimAll.isPending ? 'Claiming…' : 'Claim All'}
              </Button>
            </div>
          ) : null}

          <Separator />

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">By App</h3>
            {earningsError ? (
              <div className="text-sm text-red-500">{earningsError.message}</div>
            ) : earningsLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : earnings ? (
              <div className="space-y-2">
                {Object.entries(earnings.byApp).map(([appId, amount]) => (
                  <div key={appId} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{appId}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(amount)}</span>
                      <ClaimButton
                        appId={appId}
                        disabled={amount <= 0}
                        onClaim={async () => {
                          await refetch();
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Payouts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingError ? (
            <div className="text-sm text-red-500">{pendingError.message}</div>
          ) : pendingLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : pending && pending.length > 0 ? (
            pending.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{p.echoAppId}</span>
                <span className="font-medium">{formatCurrency(Number(p.amount))}</span>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No pending payouts</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ClaimButton({
  appId,
  disabled,
  onClaim,
}: {
  appId: string;
  disabled?: boolean;
  onClaim: () => void | Promise<void>;
}) {
  const utils = api.useUtils();
  const claim = api.user.payout.referral.claimForApp.useMutation({
    onSuccess: res => {
      toast.success(`Created referral payout for app. Remaining: ${formatCurrency(res.remaining)}`);
      utils.user.payout.referral.get.invalidate();
      utils.user.payout.referral.pending.invalidate();
      onClaim();
    },
    onError: err => {
      toast.error(err.message || 'Failed to claim referral reward');
    },
  });

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled || claim.isPending}
      onClick={() => claim.mutate({ appId })}
    >
      {claim.isPending ? 'Claiming…' : 'Claim'}
    </Button>
  );
}


