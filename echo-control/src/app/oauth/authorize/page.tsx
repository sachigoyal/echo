import { z } from 'zod';

import { auth } from '@/auth';
import { GlassButton } from '@/components/glass-button';
import { useUser } from '@/hooks/use-user';
import { api } from '@/trpc/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

const authorizeParamsSchema = z.object({
  client_id: z.string().min(1, 'client_id is required'),
  redirect_uri: z.url('redirect_uri must be a valid URL'),
  code_challenge: z.string().min(1, 'code_challenge is required'),
  code_challenge_method: z.literal('S256', {
    error: 'Only S256 code challenge method is supported',
  }),
  scope: z.string().min(1, 'scope is required'),
  response_type: z.literal('code', {
    error: 'Only authorization code flow (response_type=code) is supported',
  }),
  state: z.string().optional(),
});

type AuthorizeParams = z.infer<typeof authorizeParamsSchema>;

export default async function OAuthAuthorizePage({
  searchParams,
}: {
  searchParams: Promise<AuthorizeParams>;
}) {
  const resolvedParams = await searchParams;

  const parseResult = authorizeParamsSchema.safeParse(resolvedParams);

  if (!parseResult.success) {
    return (
      <div className="p-6 text-red-600">
        {parseResult.error.issues.map(err => (
          <div key={err.path.join('.')}>{err.message}</div>
        ))}
      </div>
    );
  }

  const authParams = parseResult.data;

  const session = await auth();
  const redirectUrl = new URL('/oauth/authorize');
  for (const [key, value] of Object.entries(authParams)) {
    redirectUrl.searchParams.set(key, value);
  }

  if (!session?.user) {
    return redirect(redirectUrl.toString());
  }

  const appDetails = await api.apps
    .getPublicApp({
      appId: authParams.client_id,
    })
    .catch(() => null);

  if (!appDetails) {
    return notFound();
  }

  const {
    name,
    description,
    owner: { name: ownerName },
  } = appDetails;

  const handleAuthorize = async () => {
    try {
      // Call the authorization API endpoint
      const response = await fetch('/api/oauth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authParams),
      });

      const result = await response.json();

      if (response.ok) {
        // Redirect to the provided redirect URI with authorization code
        window.location.href = result.redirect_url;
      } else {
        setError(result.error_description || 'Authorization failed');
      }
    } catch {
      setError('Failed to authorize application');
    }
  };

  const handleDeny = () => {
    if (!authParams) return;

    // Redirect back with error
    const redirectUrl = new URL(authParams.redirect_uri);
    redirectUrl.searchParams.set('error', 'access_denied');
    redirectUrl.searchParams.set(
      'error_description',
      'User denied authorization'
    );
    if (authParams.state) {
      redirectUrl.searchParams.set('state', authParams.state);
    }
    window.location.href = redirectUrl.toString();
  };

  const scopes = authParams.scope.split(' ');

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
            Authorize Application
          </h1>
          <p className="text-muted-foreground">
            Grant access to your Echo account
          </p>
        </div>

        <div className="bg-card rounded-lg border border-border p-6 shadow-lg">
          {/* App Information */}
          <div className="text-center mb-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground mb-1">
                {name}
              </h2>
              {ownerName && (
                <p className="text-sm text-muted-foreground">by {ownerName}</p>
              )}
              {appDetails?.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {appDetails.description}
                </p>
              )}
            </div>
            <p className="text-foreground">wants to access your Echo account</p>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-foreground mb-3">
                This application will be able to:
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {scopes.map(scope => (
                  <li key={scope} className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-emerald-500 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>
                      {scope === 'llm:invoke' &&
                        'Make LLM API requests on your behalf'}
                      {scope === 'offline_access' &&
                        "Access your account when you're not online"}
                      {!['llm:invoke', 'offline_access'].includes(scope) &&
                        `Access: ${scope}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground mb-4 space-y-1">
                <p>
                  <span className="font-medium">Redirect URI:</span>{' '}
                  {authParams.redirect_uri}
                </p>
                <p>
                  <span className="font-medium">Client ID:</span>{' '}
                  {authParams.client_id}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Link href={redirectUrl.toString()}>
                <GlassButton
                  onClick={handleDeny}
                  disabled={isAuthorizing}
                  variant="secondary"
                  className="flex-1"
                >
                  Deny
                </GlassButton>
              </Link>
              <GlassButton
                onClick={handleAuthorize}
                disabled={isAuthorizing}
                variant="primary"
                className="flex-1"
              >
                {isAuthorizing ? 'Authorizing...' : 'Authorize'}
              </GlassButton>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              By authorizing, you allow this application to access your Echo
              account according to the permissions listed above.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
