import { userOrRedirect } from '@/auth/user-or-redirect';
import Coupon from '@/components/coupon';
import { Card } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import { Separator } from '@/components/ui/separator';
import { Metadata, Route } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

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

  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full">
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
      <Coupon />
      <p>
        By claiming these credits, you agree to the{' '}
        <Link href="/terms">Terms of Service</Link> and{' '}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </div>
  );
}
