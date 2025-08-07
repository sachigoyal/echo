import { signIn } from '@/auth';
import { providers } from '@/auth/providers';
import { ProviderButton } from './provider-button';
import { Logo } from '@/components/ui/logo';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { redirect_url } = await searchParams;

  const redirectTo =
    redirect_url && typeof redirect_url === 'string' ? redirect_url : '/';

  return (
    <div className="relative size-full flex flex-col items-center justify-center pb-16 gap-4">
      <div className="w-full max-w-sm gap-6 flex flex-col items-center z-10 p-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo className="size-16" />
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold text-foreground">
              Welcome to Echo
            </h1>
            <h2 className="text-muted-foreground text-sm">
              Sign in with your Google or GitHub account
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
              redirectTo,
            });
          }}
          className="flex flex-col gap-2 w-full"
        >
          {providers.map(provider => {
            return <ProviderButton key={provider.id} provider={provider} />;
          })}
        </form>
      </div>
    </div>
  );
}
