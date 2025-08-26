import { api } from '@/trpc/server';
import { FormCard } from '../../../_components/form/card';
import { MarkupInput } from './input';
import { MarkupFormProvider } from './provider';
import { Skeleton } from '@/components/ui/skeleton';

const MarkupFormCard = ({
  children,
  isLoading,
}: {
  children: React.ReactNode;
  isLoading: boolean;
}) => {
  return (
    <FormCard
      title="Markup"
      description="How much you want to upcharge for each input and output token processed on your app."
      docsUrl="/docs/monetization"
      isLoading={isLoading}
    >
      {children}
    </FormCard>
  );
};

export const MarkupForm = async ({ appId }: { appId: string }) => {
  const markup = await api.apps.app.markup.get(appId);

  return (
    <MarkupFormProvider
      defaultValues={{
        markup: Number(markup?.amount) ?? 2,
      }}
      action={async values => {
        'use server';
        await api.apps.app.markup.update({
          appId,
          markup: values.markup,
        });
      }}
    >
      <MarkupFormCard isLoading={false}>
        <MarkupInput />
      </MarkupFormCard>
    </MarkupFormProvider>
  );
};

export const LoadingMarkupForm = () => {
  return (
    <MarkupFormCard isLoading={true}>
      <Skeleton className="w-full h-[238px]" />
    </MarkupFormCard>
  );
};
