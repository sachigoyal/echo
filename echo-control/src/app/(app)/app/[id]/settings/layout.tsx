import { Body, Heading } from '../../../_components/layout/page-utils';
import { SettingsNav } from './_components/nav';
import { forbidden, notFound } from 'next/navigation';

import type { Metadata } from 'next';
import { getApp, getIsOwner } from '../_lib/fetch';

export const metadata: Metadata = {
  title: 'Settings',
};

export default async function AppSettingsLayout({
  children,
  params,
}: LayoutProps<'/app/[id]/settings'>) {
  const { id } = await params;

  try {
    await getApp(id);
  } catch (error) {
    return notFound();
  }

  const isOwner = await getIsOwner(id);

  if (!isOwner) {
    return forbidden();
  }

  return (
    <div>
      <Heading title="App Settings" />
      <Body>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="lg:w-[240px] lg:sticky lg:top-0">
            <SettingsNav appId={id} />
          </div>
          <div className="flex-1 flex flex-col gap-6">{children}</div>
        </div>
      </Body>
    </div>
  );
}
