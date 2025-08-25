import { api } from '@/trpc/server';
import { GithubLinkInput } from './_components/github-link/input';
import { GithubLinkFormProvider } from './_components/github-link/provider';
import { FormCard } from '../_components/form/card';

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
            url: values.url,
          });
        }}
      >
        <GithubLinkInput />
      </GithubLinkFormProvider>
    </div>
  );
}
