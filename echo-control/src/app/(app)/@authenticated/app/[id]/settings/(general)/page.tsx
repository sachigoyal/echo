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
import { AppHomepage } from './_components/homepage';
import { SettingsNav } from '../_components/nav';
import { GeneralAppSettings } from './_components';

export default async function AppSettingsPage({
  params,
}: PageProps<'/app/[id]/settings'>) {
  const { id } = await params;

  return (
    <>
      <div className="w-full lg:hidden">
        <SettingsNav appId={id} />
      </div>
      <div className="w-full hidden lg:block">
        <GeneralAppSettings appId={id} />
      </div>
    </>
  );
}
