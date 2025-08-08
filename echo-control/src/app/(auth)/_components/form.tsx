import { signIn } from '@/auth';
import { oauthProviders } from '@/auth/providers';
import { ProviderButton } from '../_components/provider-button';
import { Logo } from '@/components/ui/logo';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { redirect } from 'next/navigation';

interface Props {
  redirectUrl?: string;
  isSignUp: boolean;
}

export const SignInForm: React.FC<Props> = ({ redirectUrl, isSignUp }) => {
  return (
    <div className="relative size-full flex flex-col items-center justify-center pb-16 gap-4">
      <div className="w-full max-w-md gap-6 flex flex-col items-center z-10 p-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="size-16 p-3 border border-border/40 rounded-xl flex items-center justify-center">
            <Logo className="size-full" />
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold text-foreground">
              {isSignUp ? 'Create an Echo Account' : 'Log in to Echo'}
            </h1>
            <h2 className="text-muted-foreground/80 text-sm">
              {isSignUp
                ? 'Already have an account? '
                : "Don't have an account? "}
              <Link
                href={
                  isSignUp
                    ? `/login${redirectUrl ? `?redirect_url=${redirectUrl}` : ''}`
                    : `/signup${redirectUrl ? `?redirect_url=${redirectUrl}` : ''}`
                }
                className="font-semibold hover:opacity-60 transition-opacity"
              >
                {isSignUp ? 'Log in' : 'Sign up'}
              </Link>
            </h2>
          </div>
        </div>
        <form
          action={async formData => {
            'use server';

            const provider = formData.get('provider');
            if (!provider) {
              throw new Error('Provider is required');
            }

            await signIn(provider as string, {
              redirectTo: redirectUrl || '/',
            });
          }}
          className="flex flex-col sm:flex-row gap-2 w-full items-center"
        >
          {oauthProviders.map(provider => {
            return <ProviderButton key={provider.id} provider={provider} />;
          })}
        </form>
        <div className="flex items-center gap-4 w-full opacity-60">
          <Separator className="flex-1" />
          <span className="text-muted-foreground text-sm">or</span>
          <Separator className="flex-1" />
        </div>
        <form
          className="flex flex-col gap-4 w-full group"
          action={async formData => {
            'use server';
            const email = formData.get('email');
            if (!email || typeof email !== 'string') {
              throw new Error('Email is required');
            }

            await signIn('resend', {
              email,
              redirectTo: redirectUrl || '/',
              redirect: false,
            });

            return redirect('/verify-email');
          }}
        >
          <div className="flex flex-col gap-1">
            <label
              htmlFor="email"
              className="text-sm text-muted-foreground/80 font-medium"
            >
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="richard@piedpiper.com"
              className="border-border/30 bg-input/40 rounded-xl placeholder:text-muted-foreground/40 py-3 px-4 h-fit peer border-2 focus-visible:ring-border/60 font-medium"
              required
            />
            <p className="text-xs text-muted-foreground/60">
              We'll send you a link to sign in with your email.
            </p>
          </div>
          <Button
            type="submit"
            className={cn(
              'w-full bg-input/40 hover:bg-input/60 rounded-xl py-3 h-fit border-2 border-border/30 font-bold transition-all',
              'group-invalid:pointer-events-none group-invalid:opacity-40 group-invalid:cursor-not-allowed'
            )}
            variant="unstyled"
          >
            {isSignUp ? 'Create Account' : 'Log In'}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground/60">
          By {isSignUp ? 'creating an account' : 'signing in'}, you agree to our{' '}
          <Link href="/terms" className="underline">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
};
