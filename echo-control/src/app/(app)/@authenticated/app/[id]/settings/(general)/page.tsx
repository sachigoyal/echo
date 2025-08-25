import z from 'zod';

import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { FormCard } from '../_components/form/card';

import { AppDetailsFormProvider } from './_components/provider';
import { AppName } from './_components/name';
import { AppDescription } from './_components/description';

import { api } from '@/trpc/server';

import { updateAppSchema } from '@/services/apps/owner';
import { AppProfilePicture } from './_components/profile-picture';

export default async function AppSettingsPage({
  params,
}: PageProps<'/app/[id]/settings'>) {
  const { id } = await params;

  const app = await api.apps.public.get(id);

  if (!app) {
    return notFound();
  }

  const updateApp = async (values: z.infer<typeof updateAppSchema>) => {
    'use server';
    await api.apps.owner
      .update({
        appId: id,
        ...values,
      })
      .then(() => {
        revalidatePath(`/app/${id}`);
      });
  };

  return (
    <div className="flex flex-col gap-6">
      <AppDetailsFormProvider
        title="Name"
        fields={['name']}
        action={updateApp}
        defaultValues={{ name: app.name ?? '' }}
      >
        <FormCard
          title="Name"
          description="The public-facing name of your app. This is shown to users when they are connecting to your app."
          docsUrl="/docs/general"
        >
          <AppName />
        </FormCard>
      </AppDetailsFormProvider>

      <AppDetailsFormProvider
        title="Description"
        fields={['description']}
        action={updateApp}
        defaultValues={{ description: app.description ?? '' }}
      >
        <FormCard
          title="Description"
          description="The description of your app. This is shown to users when they are connecting to your app."
          docsUrl="/docs/general"
        >
          <AppDescription />
        </FormCard>
      </AppDetailsFormProvider>

      <AppDetailsFormProvider
        fields={['profilePictureUrl']}
        title="Profile Picture"
        action={updateApp}
        defaultValues={{ profilePictureUrl: app.profilePictureUrl ?? '' }}
      >
        <FormCard
          title="Profile Picture"
          description="The profile picture of your app. This is shown to users when they are connecting to your app."
          docsUrl="/docs/general"
        >
          <AppProfilePicture />
        </FormCard>
      </AppDetailsFormProvider>
    </div>
  );
}
