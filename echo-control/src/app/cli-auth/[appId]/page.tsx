import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import ProfileAvatar from '@/components/ui/profile-avatar';
import { UserAvatar } from '@/components/utils/user-avatar';
import { api } from '@/trpc/server';
import { Code } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { GenerateKey } from './_components/generate-key';

export default async function CliAuthAppPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;

  const app = await api.apps.public.get(appId);

  if (!app) {
    return notFound();
  }

  const member = await api.apps.member.get(appId);

  return (
    <div className="flex flex-col gap-8">
      <p>
        You are generating an API key for CLI access to the Echo app{' '}
        <span className="font-bold">{app.name}</span>.
      </p>
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-4">
            <UserAvatar
              src={app.profilePictureUrl ?? undefined}
              fallback={<Code className="size-full" />}
              className="size-8 border-none"
            />
            <div className="flex flex-col">
              <CardTitle className="text-lg font-semibold">
                {app.name}
              </CardTitle>
              <ErrorBoundary fallback={<p>Error</p>}>
                <Suspense fallback={<p>Loading...</p>}>
                  <CardDescription className="text-xs text-muted-foreground">
                    {(await api.apps.public.owner(appId)).name}
                  </CardDescription>
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>
          {app.description && <p>{app.description}</p>}
        </CardHeader>
        <CardContent className="p-4">
          <GenerateKey isMember={!!member} appId={appId} />
        </CardContent>
      </Card>
    </div>
  );
}
