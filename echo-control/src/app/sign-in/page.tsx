import { signIn } from '@/auth';
import { providers } from '@/auth/providers';
import { ProviderButton } from './provider-button';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { redirect_url } = await searchParams;

  const redirectTo =
    redirect_url && typeof redirect_url === 'string' ? redirect_url : '/';

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
              <svg
                className="w-8 h-8 text-primary-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome Back
          </h1>
          <p className="text-muted-foreground">
            Sign in to access your Echo Control Plane
          </p>
        </div>

        <div className="bg-card rounded-lg border border-border p-6 shadow-lg">
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
          >
            {providers.map(provider => {
              return <ProviderButton key={provider.id} provider={provider} />;
            })}
          </form>
        </div>
      </div>
    </main>
  );
}
