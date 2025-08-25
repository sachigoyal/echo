import { api } from '@/trpc/server';
import { MonetizationAppSettings } from './_components';
import { GithubLinkInput } from './_components/github-link/input';
import { GithubLinkFormProvider } from './_components/github-link/provider';

export default async function MonetizationAppSettingsPage({
  params,
}: PageProps<'/app/[id]/settings/monetization'>) {
  const { id } = await params;

  const githubLink = await api.apps.owner.getGithubLink({
    appId: id,
  });

  return (
    <div>
      <GithubLinkFormProvider
        defaultValues={{
          type: githubLink?.githubType ?? 'repo',
          url: githubLink?.githubUrl ?? '',
        }}
        action={async values => {
          'use server';
          await api.apps.owner.updateGithubLink({
            appId: id,
            type: values.type,
            githubUrl: values.url,
          });
        }}
      >
        <GithubLinkInput />
      </GithubLinkFormProvider>
    </div>
  );
}
