import { Suspense } from 'react';

import { Code, User } from 'lucide-react';

import { ErrorBoundary } from 'react-error-boundary';

import { Separator } from '../../_components/separator';
import { Breadcrumb, LoadingBreadcrumb } from '../../_components/breadcrumb';

import { api } from '@/trpc/server';

export default async function AppBreadcrumbs({
  params,
}: PageProps<'/app/[id]'>) {
  const { id } = await params;

  return (
    <>
      <ErrorBoundary fallback={null}>
        <Separator />
        <Suspense fallback={<LoadingBreadcrumb />}>
          <UserBreadcrumb id={id} />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary fallback={null}>
        <Separator />
        <Suspense fallback={<LoadingBreadcrumb />}>
          <AppBreadcrumb id={id} />
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

const UserBreadcrumb = async ({ id }: { id: string }) => {
  const owner = await api.apps.public.owner(id);
  return (
    <Breadcrumb
      href={`/user/${owner.id}`}
      image={owner.image ?? null}
      name={owner.name ?? 'Unknown'}
      Fallback={User}
    />
  );
};

const AppBreadcrumb = async ({ id }: { id: string }) => {
  const app = await api.apps.public.get(id);
  return (
    <Breadcrumb
      href={`/app/${id}`}
      image={app.profilePictureUrl ?? null}
      name={app.name}
      Fallback={Code}
    />
  );
};
