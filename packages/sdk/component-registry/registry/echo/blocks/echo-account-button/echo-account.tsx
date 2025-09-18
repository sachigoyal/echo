'use client';

import { EchoAccountButtonPopover } from '@/registry/echo/blocks/echo-account-button/echo-popover';
import { formatCurrency } from '@/registry/echo/blocks/lib/currency-utils';
import { Button } from '@/registry/echo/ui/echo-button';
import { Logo } from '@/registry/echo/ui/logo';
import { Popover, PopoverTrigger } from '@/registry/echo/ui/popover';
import { Skeleton } from '@/registry/echo/ui/skeleton';
import { type EchoContextValue } from '@merit-systems/echo-react-sdk';
import { Gift } from 'lucide-react';

export function EchoAccountButton({ echo }: { echo: EchoContextValue }) {
  const { user, balance, freeTierBalance, signIn, isLoading } = echo;

  const totalBalance =
    (balance?.balance || 0) + (freeTierBalance?.userSpendInfo.amountLeft || 0);
  const hasFreeCredits = freeTierBalance?.userSpendInfo.amountLeft ?? 0 > 0;
  const buttonContent = isLoading ? (
    <>
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-14" />
    </>
  ) : !user ? (
    <>
      <Logo className="size-6" />
      <span>Sign In</span>
    </>
  ) : (
    <>
      <Logo className="size-6" />
      <span>{formatCurrency(totalBalance)}</span>
    </>
  );

  const button = (
    <div className="relative inline-flex">
      <Button
        variant="outline"
        onClick={!user ? signIn : undefined}
        disabled={isLoading}
        className="w-[100px] justify-start gap-2"
      >
        {buttonContent}
      </Button>
      {hasFreeCredits ? (
        <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
          <Gift className="size-3 text-primary-foreground " />
        </div>
      ) : null}
    </div>
  );

  if (!user || isLoading) {
    return button;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{button}</PopoverTrigger>
      <EchoAccountButtonPopover echo={echo} />
    </Popover>
  );
}
