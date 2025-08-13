import { Suspense } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UserAvatar } from '@/components/utils/user-avatar';
import { api } from '@/trpc/server';
import { Code } from 'lucide-react';
import { notFound } from 'next/navigation';
import { ErrorBoundary } from 'react-error-boundary';
import { GenerateKey } from './_components/generate-key';
import { Skeleton } from '@/components/ui/skeleton';

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
            <div className="flex flex-col gap-1">
              <CardTitle className="text-lg font-semibold leading-none">
                {app.name}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                <ErrorBoundary fallback={'Owner not found'}>
                  <Suspense fallback={<Skeleton className="h-4 w-24" />}>
                    {(await api.apps.public.owner(appId)).name}
                  </Suspense>
                </ErrorBoundary>
              </CardDescription>
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
