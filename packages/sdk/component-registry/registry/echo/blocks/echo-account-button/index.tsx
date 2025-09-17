'use client';
import { Button } from '@/registry/echo/ui/button';
import { Popover, PopoverTrigger } from '@/registry/echo/ui/popover';
import { Logo, useEcho } from '@merit-systems/echo-react-sdk';
import { Gift } from 'lucide-react';
import { EchoAccountButtonPopover } from './popover';

export function EchoAccountButton() {
  const { user, balance, freeTierBalance, signIn, isLoading } = useEcho();

  const totalBalance =
    (balance?.balance || 0) + (freeTierBalance?.userSpendInfo.amountLeft || 0);
  const hasFreeCredits = freeTierBalance?.userSpendInfo.amountLeft ?? 0 > 0;
  const buttonContent = isLoading ? (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 bg-muted animate-pulse rounded" />
      <div className="w-16 h-4 bg-muted animate-pulse rounded" />
    </div>
  ) : !user ? (
    'Sign In'
  ) : (
    <div className="flex items-center gap-2">
      <Logo width={16} height={16} variant="light" />
      <span className="flex items-center gap-1">
        ${totalBalance.toLocaleString()}
        {hasFreeCredits && <Gift className="size-3 text-muted-foreground" />}
      </span>
    </div>
  );

  const button = (
    <Button
      variant="outline"
      onClick={!user ? signIn : undefined}
      disabled={isLoading}
    >
      {buttonContent}
    </Button>
  );

  if (!user || isLoading) {
    return button;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{button}</PopoverTrigger>
      <EchoAccountButtonPopover showAllApps />
    </Popover>
  );
}
