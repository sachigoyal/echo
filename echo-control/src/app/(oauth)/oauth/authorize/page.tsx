import { notFound, redirect } from 'next/navigation';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';

import { FlickeringGrid } from '@/components/magicui/flickering-grid';

import { ConnectionBeam } from './_components/connection-beam';
import { Scopes } from './_components/scopes';
import { AuthorizeButtons } from './_components/buttons';

import { auth } from '@/auth';

import { api } from '@/trpc/server';

import { authorizeParamsSchema } from '../../_lib/authorize';
import { ErrorPage } from './_components/error-page';

export default async function OAuthAuthorizePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;

  const parseResult = authorizeParamsSchema.safeParse(resolvedParams);

  if (!parseResult.success) {
    return (
      <ErrorPage
        message={
          <ul className="list-disc list-inside space-y-1 text-sm">
            {parseResult.error.issues.map(err => (
              <li key={err.path.join('.')}>{err.message}</li>
            ))}
          </ul>
        }
        redirectUrl={
          typeof resolvedParams.redirect_uri === 'string'
            ? resolvedParams.redirect_uri
            : undefined
        }
      />
    );
  }

  const authParams = parseResult.data;

  const session = await auth();
  const redirectUrl = new URL(
    '/oauth/authorize',
    process.env.ECHO_CONTROL_APP_BASE_URL
  );
  for (const [key, value] of Object.entries(authParams)) {
    redirectUrl.searchParams.set(key, value);
  }

  const loginUrl = new URL('/login', process.env.ECHO_CONTROL_APP_BASE_URL);
  loginUrl.searchParams.set('redirect_uri', redirectUrl.toString());

  if (!session?.user) {
    return redirect(loginUrl.toString());
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
    profilePictureUrl,
    owner: { name: ownerName, image: ownerImageUrl },
  } = appDetails;

  const scopes = authParams.scope.split(' ');

  return (
    <div className="relative size-full flex flex-col items-center justify-center pb-12 md:pb-16 gap-4">
      <FlickeringGrid
        className="absolute inset-0 pointer-events-none"
        frameRate={4}
      />

      <div className="w-full max-w-md flex flex-col items-center justify-center gap-8">
        <h1 className="text-3xl font-bold text-foreground">
          Connect to {name}
        </h1>
        <ConnectionBeam
          appImage={profilePictureUrl ?? ownerImageUrl}
          userImage={session.user.image}
        />

        <Card className="bg-card rounded-lg border border-border shadow-lg">
          {/* App Information */}
          <CardHeader className="p-4 border-b">
            <h2 className="text-lg text-foreground font-light">
              <span className="font-bold">{name}</span> by{' '}
              <span className="font-bold">{ownerName}</span> wants to connect to
              your Echo account
            </h2>
          </CardHeader>
          <CardContent className="p-4 border-b">
            <div className="space-y-2">
              <h4 className="text-muted-foreground text-sm">
                This application will be able to:
              </h4>
              <Scopes scopes={scopes} />
            </div>
          </CardContent>
          <CardFooter className="w-full flex justify-center p-4">
            <AuthorizeButtons params={authParams} />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
