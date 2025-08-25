import { api } from '@/trpc/server';
import { Body, Heading } from '../../../_components/layout/page-utils';
import { AppSettingsSidebar } from './_components/sidebar';
import { notFound, unauthorized } from 'next/navigation';
import { auth } from '@/auth';

export default async function AppSettingsLayout({
  children,
  params,
}: LayoutProps<'/app/[id]/settings'>) {
  const { id } = await params;

  const session = await auth();

  const owner = await api.apps.public.owner(id);

  if (!owner) {
    return notFound();
  }

  if (session?.user.id !== owner.id) {
    return unauthorized();
  }

  return (
    <div className="overflow-visible">
      <Heading title="App Settings" />
      <Body className="overflow-visible">
        <div className="flex gap-4">
          <div className="sticky top-0 hidden lg:block w-[240px] h-fit">
            <AppSettingsSidebar appId={id} />
          </div>
          <div className="flex-1">{children}</div>
        </div>
      </Body>
    </div>
  );
}
