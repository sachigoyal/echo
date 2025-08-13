'use client';

import { api } from '@/trpc/client';

import { GenerateApiKey as GenerateApiKeyComponent } from '@/app/cli-auth/_components/generate-key';

interface Props {
  isMember: boolean;
  appId: string;
}

export const GenerateKey: React.FC<Props> = ({ isMember, appId }) => {
  if (!isMember) {
    return <NonMemberGenerateKey appId={appId} />;
  }

  return <MemberGenerateKey appId={appId} />;
};

const MemberGenerateKey = ({ appId }: { appId: string }) => {
  const {
    mutateAsync: generateApiKey,
    data: apiKey,
    isPending,
  } = api.user.apiKeys.create.useMutation();

  return (
    <GenerateApiKeyComponent
      apiKey={apiKey?.key}
      isPending={isPending}
      generateApiKey={async name =>
        (await generateApiKey({ echoAppId: appId, name })).key
      }
    />
  );
};

const NonMemberGenerateKey = ({ appId }: { appId: string }) => {
  const {
    mutateAsync: generateApiKey,
    data: apiKey,
    isPending: isGenerating,
  } = api.user.apiKeys.create.useMutation();

  const { mutateAsync: joinApp, isPending: isJoining } =
    api.apps.member.join.useMutation();

  const handleGenerateApiKey = async (name?: string) => {
    await joinApp(appId);
    return (await generateApiKey({ echoAppId: appId, name })).key;
  };

  return (
    <GenerateApiKeyComponent
      apiKey={apiKey?.key}
      isPending={isGenerating || isJoining}
      generateApiKey={handleGenerateApiKey}
    />
  );
};
