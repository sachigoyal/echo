import { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';

import { Code, User } from 'lucide-react';

import { Breadcrumb, LoadingBreadcrumb } from '../../_components/breadcrumb';
import { Separator } from '../../_components/separator';

import { api } from '@/trpc/server';

export default async function AppBreadcrumbsLayout({
  children,
  params,
}: LayoutProps<'/app/[id]'>) {
  const { id } = await params;
  console.log('AppBreadcrumbsLayout', id);
  return (
    <>
      <AppBreadcrumbs id={id} />
      {children}
    </>
  );
}

const AppBreadcrumbs = ({ id }: { id: string }) => {
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
};

const UserBreadcrumb = async ({ id }: { id: string }) => {
  const owner = await api.apps.app.getOwner(id);
  return (
    <Breadcrumb
      href={`/user/${owner.id}`}
      image={owner.image ?? null}
      name={owner.name ?? 'Unknown'}
      Fallback={User}
      mobileHideText
      disabled
    />
  );
};

const AppBreadcrumb = async ({ id }: { id: string }) => {
  const app = await api.apps.app.get({ appId: id });
  return (
    <Breadcrumb
      href={`/app/${id}`}
      image={app.profilePictureUrl ?? null}
      name={app.name}
      Fallback={Code}
    />
  );
};
