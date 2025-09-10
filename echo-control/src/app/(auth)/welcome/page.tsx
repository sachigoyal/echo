import { userOrRedirect } from '@/auth/user-or-redirect';
import { Card } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import { Separator } from '@/components/ui/separator';
import { api } from '@/trpc/server';
import { Metadata, Route } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { WelcomeCoupon } from './_components/coupon';

export const metadata: Metadata = {
  title: 'Welcome',
  description: 'The Easiest Way to Monetize AI Apps',
};

export default async function WelcomePage(props: PageProps<'/welcome'>) {
  const user = await userOrRedirect('/welcome', props);

  const searchParams = await props.searchParams;

  const callbackUrl =
    searchParams.callbackUrl && typeof searchParams.callbackUrl === 'string'
      ? searchParams.callbackUrl
      : '/';
  const isAppAuthorize = callbackUrl.includes('/oauth/authorize');

  if (isAppAuthorize) {
    const redirectUrl = new URL(callbackUrl);
    redirectUrl.searchParams.set('new_user', 'true');
    return redirect(redirectUrl.toString() as Route);
  }

  const hasClaimed = await api.user.initialFreeTier.hasClaimed();

  if (hasClaimed) {
    return redirect('/dashboard');
  }

  const couponAmount = Number.parseFloat(
    process.env.LATEST_FREE_TIER_CREDITS_ISSUANCE_AMOUNT ?? '0'
  );
  if (!Number.isFinite(couponAmount) || couponAmount <= 0) {
    throw new Error('LATEST_FREE_TIER_CREDITS_ISSUANCE_AMOUNT is not set');
  }

  const couponVersion = process.env.LATEST_FREE_TIER_CREDITS_ISSUANCE_VERSION;
  if (!couponVersion) {
    throw new Error('LATEST_FREE_TIER_CREDITS_ISSUANCE_VERSION is not set');
  }

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full">
      <div className="flex flex-col items-center gap-4 text-center">
        <Card className="size-16 p-3 border rounded-xl flex items-center justify-center bg-card">
          <Logo className="size-full" />
        </Card>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome to Echo{user.name ? `, ${user.name.split(' ')[0]}!` : '!'}
          </h1>
          <h2 className="text-muted-foreground/80">
            {isAppAuthorize
              ? 'Your Global Account for AI Access'
              : 'The Easiest Way to Monetize AI Apps'}
          </h2>
        </div>
      </div>
      <Separator />
      <div className="flex flex-col items-center gap-4 w-full">
        <WelcomeCoupon
          amount={couponAmount}
          callbackUrl={callbackUrl as Route}
        />
        <p className="text-sm text-muted-foreground text-center">
          By claiming these credits, you agree to the
          <br />
          <Link
            href="/terms"
            target="_blank"
            className="underline font-semibold"
          >
            Terms of Service
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
