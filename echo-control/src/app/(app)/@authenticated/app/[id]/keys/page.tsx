import { api } from '@/trpc/server';
import { HydrateClient } from '@/trpc/server';
import { notFound } from 'next/navigation';
import { Heading } from '../../../_components/layout/page-utils';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GenerateKey } from './_components/generate-key';
import { Body } from '../../../_components/layout/page-utils';
import { ErrorBoundary } from 'react-error-boundary';
import { Suspense } from 'react';
import { Keys } from './_components/keys';
import { UserAvatar } from '@/components/utils/user-avatar';
import { Code } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default async function AppPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const { generate } = await searchParams;

  const app = await api.apps.public.get(id);

  if (!app) {
    return notFound();
  }

  const member = await api.apps.member.get(id);

  api.user.apiKeys.list.prefetchInfinite({ appId: id });

  return (
    <HydrateClient>
      <Heading
        title="API Keys"
        actions={
          <Dialog defaultOpen={!!generate}>
            <DialogTrigger asChild>
              <Button variant="turbo">Generate Key</Button>
            </DialogTrigger>
            <DialogContent className="p-0 overflow-hidden">
              <DialogHeader className="p-4 pb-0">
                <DialogTitle className="text-lg font-semibold leading-none">
                  Generate API Key
                </DialogTitle>
                <DialogDescription>
                  This key can only be used in{' '}
                  <span className="font-bold">{app.name}</span>.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-4 p-4 bg-muted mx-4 rounded-lg">
                <UserAvatar
                  src={app.profilePictureUrl ?? undefined}
                  fallback={<Code className="size-6" />}
                  className="size-8"
                />
                <div className="flex flex-col gap-1">
                  <h2 className="text-base font-semibold leading-none">
                    {app.name}
                  </h2>

                  <Suspense fallback={<Skeleton className="h-4 w-24" />}>
                    <p className="text-xs text-muted-foreground">
                      <Owner appId={id} />
                    </p>
                  </Suspense>
                </div>
              </div>
              <div className="w-full max-w-full overflow-hidden p-4 pt-0">
                <GenerateKey isMember={!!member} appId={id} />
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <Body>
        <Card className="bg-muted/50">
          <CardHeader className="border-b p-4">
            <CardTitle className="text-lg font-semibold">API Keys</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ErrorBoundary fallback={<div>Error loading keys</div>}>
              <Suspense fallback={<div>Loading keys...</div>}>
                <Keys appId={id} />
              </Suspense>
            </ErrorBoundary>
          </CardContent>
        </Card>
      </Body>
    </HydrateClient>
  );
}

const Owner = async ({ appId }: { appId: string }) => {
  const owner = await api.apps.public
    .owner(appId)
    .then(owner => owner.name)
    .catch(() => 'Owner not found');

  return owner;
};
