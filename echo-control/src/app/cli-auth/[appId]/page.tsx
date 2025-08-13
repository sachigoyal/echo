import { Suspense } from 'react';

import { Code } from 'lucide-react';

import { notFound } from 'next/navigation';

import { ErrorBoundary } from 'react-error-boundary';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { UserAvatar } from '@/components/utils/user-avatar';

import { GenerateKey } from './_components/generate-key';

import { api } from '@/trpc/server';

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
    <div className="flex flex-col gap-8 pt-2">
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
              <Suspense fallback={<Skeleton className="h-4 w-24" />}>
                <Owner appId={appId} />
              </Suspense>
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

const Owner = async ({ appId }: { appId: string }) => {
  const owner = await api.apps.public
    .owner(appId)
    .then(owner => owner.name)
    .catch(() => 'Owner not found');

  return (
    <CardDescription className="text-xs text-muted-foreground">
      {owner}
    </CardDescription>
  );
};
