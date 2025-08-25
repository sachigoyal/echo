import { Skeleton } from '@/components/ui/skeleton';

import { FormCard } from '../../../_components/form/card';

import { AuthorizedCallbackUrlsInput } from './input';
import { AuthorizedCallbacksFormProvider } from './provider';

import { api } from '@/trpc/server';

const AuthorizedCallbacksFormCard = ({
  children,
  isLoading,
}: {
  children: React.ReactNode;
  isLoading: boolean;
}) => {
  return (
    <FormCard
      title="Authorized Callbacks"
      description="The URLs that are authorized to receive OAuth callbacks."
      docsUrl="/docs/security"
      isLoading={isLoading}
    >
      {children}
    </FormCard>
  );
};

export const AuthorizedCallbacksForm = async ({ appId }: { appId: string }) => {
  const authorizedCallbackUrls =
    await api.apps.public.authorizedCallbackUrls(appId);

  return (
    <AuthorizedCallbacksFormProvider
      defaultValues={{
        authorizedCallbackUrls:
          authorizedCallbackUrls?.authorizedCallbackUrls ?? [],
      }}
      action={async values => {
        'use server';
        console.log(values);
        await api.apps.owner.updateAuthorizedCallbackUrls({
          appId,
          authorizedCallbackUrls: values.authorizedCallbackUrls,
        });
      }}
    >
      <AuthorizedCallbacksFormCard isLoading={false}>
        <AuthorizedCallbackUrlsInput />
      </AuthorizedCallbacksFormCard>
    </AuthorizedCallbacksFormProvider>
  );
};

export const LoadingMarkupForm = () => {
  return (
    <AuthorizedCallbacksFormCard isLoading={true}>
      <Skeleton className="w-full h-[238px]" />
    </AuthorizedCallbacksFormCard>
  );
};
