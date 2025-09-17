'use client';
import { Button } from '@/registry/echo/ui/button';
import { Popover, PopoverTrigger } from '@/registry/echo/ui/popover';
import { Skeleton } from '@/registry/echo/ui/skeleton';
import { Logo, useEcho } from '@merit-systems/echo-react-sdk';
import { Gift } from 'lucide-react';
import { EchoAccountButtonPopover } from './popover';

export function EchoAccountButton() {
  const { user, balance, freeTierBalance, signIn, isLoading } = useEcho();

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
      <div className="h-4 w-4" />
      <span>Sign In</span>
    </>
  ) : (
    <>
      <Logo width={16} height={16} variant="light" />
      <span className="flex items-center gap-1">
        ${totalBalance.toLocaleString()}
        {hasFreeCredits && <Gift className="size-3 text-muted-foreground" />}
      </span>
    </>
  );

  const button = (
    <Button
      variant="outline"
      onClick={!user ? signIn : undefined}
      disabled={isLoading}
      className="w-[120px] justify-start gap-2"
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
