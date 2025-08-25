import { Body, Heading } from '../../../_components/layout/page-utils';
import { AppSettingsSidebar } from './_components/sidebar';

export default async function AppSettingsLayout({
  children,
  params,
}: LayoutProps<'/app/[id]/settings'>) {
  const { id } = await params;

  return (
    <div>
      <Heading title="App Settings" />
      <Body>
        <div className="flex gap-4">
          <AppSettingsSidebar appId={id} />
          <div className="flex-1 p-4">{children}</div>
        </div>
      </Body>
    </div>
  );
}
