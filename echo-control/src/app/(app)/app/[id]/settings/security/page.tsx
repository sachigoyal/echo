import { AuthorizedCallbacksForm } from './_components/authorized-callbacks';

export default async function SecurityAppSettingsPage({
  params,
}: PageProps<'/app/[id]/settings/security'>) {
  const { id } = await params;

  return <AuthorizedCallbacksForm appId={id} />;
}
