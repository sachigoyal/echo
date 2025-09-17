'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Copy, Check } from 'lucide-react';
import { api } from '@/trpc/client';

interface MintedCode {
  code: string;
  grantAmount: number;
  expiresAt: Date;
  maxUses?: number;
  maxUsesPerUser?: number;
}

export const CreditGrantForm = () => {
  const [amount, setAmount] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [maxUses, setMaxUses] = useState<string>('');
  const [maxUsesPerUser, setMaxUsesPerUser] = useState<string>('');
  const [mintedCodes, setMintedCodes] = useState<MintedCode[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mintCodeMutation = api.admin.creditGrants.create.useMutation({
    onSuccess: data => {
      // Convert grantAmount from Decimal to number
      const convertedData: MintedCode = {
        code: data.code,
        grantAmount:
          typeof data.grantAmount === 'number'
            ? data.grantAmount
            : Number(data.grantAmount),
        expiresAt: data.expiresAt,
        maxUses: data.maxUses || undefined,
        maxUsesPerUser: data.maxUsesPerUser || undefined,
      };
      setMintedCodes([convertedData, ...mintedCodes]);
      setAmount('');
      setExpiresAt('');
      setMaxUses('');
      setMaxUsesPerUser('');
      setError(null);
    },
    onError: error => {
      setError(error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountInDollars = parseFloat(amount);
    if (isNaN(amountInDollars) || amountInDollars <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    const expirationDate = expiresAt ? new Date(expiresAt) : undefined;
    const maxUsesValue = maxUses ? parseInt(maxUses, 10) : undefined;
    const maxUsesPerUserValue = maxUsesPerUser
      ? parseInt(maxUsesPerUser, 10)
      : undefined;

    if (maxUses && (isNaN(maxUsesValue!) || maxUsesValue! <= 0)) {
      setError('Please enter a valid positive number for max uses');
      return;
    }

    if (
      maxUsesPerUser &&
      (isNaN(maxUsesPerUserValue!) || maxUsesPerUserValue! <= 0)
    ) {
      setError('Please enter a valid positive number for max uses per user');
      return;
    }

    await mintCodeMutation.mutateAsync({
      amountInDollars,
      expiresAt: expirationDate,
      maxUses: maxUsesValue,
      maxUsesPerUser: maxUsesPerUserValue,
    });
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mint Code Form */}
      <Card>
        <CardHeader>
          <CardTitle>Mint Credit Grant Code</CardTitle>
          <CardDescription>
            Create a new referral code that grants credits to users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">
                Credit Amount (USD)
              </label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter amount in dollars"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="expiresAt" className="text-sm font-medium">
                Expiration Date (Optional)
              </label>
              <Input
                id="expiresAt"
                type="date"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to default to 1 year from now
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="maxUses" className="text-sm font-medium">
                Max Uses (Optional)
              </label>
              <Input
                id="maxUses"
                type="number"
                min="1"
                step="1"
                placeholder="Enter maximum number of uses"
                value={maxUses}
                onChange={e => setMaxUses(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for unlimited uses
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="maxUsesPerUser" className="text-sm font-medium">
                Max Uses Per User (Optional)
              </label>
              <Input
                id="maxUsesPerUser"
                type="number"
                min="1"
                step="1"
                placeholder="Enter maximum uses per user"
                value={maxUsesPerUser}
                onChange={e => setMaxUsesPerUser(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for unlimited uses per user
              </p>
            </div>

            <Button
              type="submit"
              disabled={mintCodeMutation.isPending || !amount}
              className="w-full"
            >
              {mintCodeMutation.isPending
                ? 'Minting Code...'
                : 'Mint Credit Code'}
            </Button>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Minted Codes List */}
      {mintedCodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Minted Codes</CardTitle>
            <CardDescription>
              Codes created in this session. Share these with users to grant
              them credits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mintedCodes.map((mintedCode, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="font-mono text-sm font-medium">
                      {mintedCode.code}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ${mintedCode.grantAmount.toFixed(2)} • Expires{' '}
                      {mintedCode.expiresAt.toLocaleDateString()}
                      {mintedCode.maxUses &&
                        ` • Max uses: ${mintedCode.maxUses}`}
                      {mintedCode.maxUsesPerUser &&
                        ` • Max per user: ${mintedCode.maxUsesPerUser}`}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(mintedCode.code)}
                    className="ml-2"
                  >
                    {copiedCode === mintedCode.code ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
