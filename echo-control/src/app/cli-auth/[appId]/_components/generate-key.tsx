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
    mutate: generateApiKey,
    data: apiKey,
    isPending,
  } = api.user.apiKeys.create.useMutation();

  return (
    <GenerateApiKeyComponent
      apiKey={apiKey?.key}
      isPending={isPending}
      generateApiKey={name => generateApiKey({ echoAppId: appId, name })}
    />
  );
};

const NonMemberGenerateKey = ({ appId }: { appId: string }) => {
  const {
    mutate: generateApiKey,
    data: apiKey,
    isPending: isGenerating,
  } = api.user.apiKeys.create.useMutation({});

  const { mutate: joinApp, isPending: isJoining } =
    api.apps.member.join.useMutation({
      onSuccess: () => {
        generateApiKey({ echoAppId: appId, name: 'CLI' });
      },
    });

  const handleGenerateApiKey = (name?: string) => {
    joinApp(appId, {
      onSuccess: () => {
        generateApiKey({ echoAppId: appId, name });
      },
    });
  };

  return (
    <GenerateApiKeyComponent
      apiKey={apiKey?.key}
      isPending={isGenerating}
      generateApiKey={name => handleGenerateApiKey(name)}
    />
  );
};
