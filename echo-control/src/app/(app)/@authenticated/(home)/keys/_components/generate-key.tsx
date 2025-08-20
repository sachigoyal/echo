'use client';

import { Suspense, useState } from 'react';

import { Code, Loader2 } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

import { UserAvatar } from '@/components/utils/user-avatar';

import { GenerateApiKey } from '../../../_components/keys/generate-key';

import { api } from '@/trpc/client';

export const GenerateKeyWithSelect = () => {
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState(false);

  const {
    mutateAsync: generateApiKey,
    isPending: isGenerating,
    data: apiKey,
  } = api.user.apiKeys.create.useMutation({
    onSuccess: () => {
      setIsCompleted(true);
    },
  });

  return (
    <div className="flex flex-col gap-4 w-full max-w-full">
      <div className="flex flex-col gap-1 w-full">
        <Label
          htmlFor="app-select"
          className="block text-sm font-medium text-card-foreground"
        >
          Select Echo App <span className="text-red-500">*</span>
        </Label>
        <Select
          value={selectedAppId}
          onValueChange={setSelectedAppId}
          disabled={isCompleted}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose an app" />
          </SelectTrigger>
          <Suspense fallback={<Skeleton className="h-10 w-full" />}>
            <AppSelect />
          </Suspense>
        </Select>
        <p className="text-xs text-muted-foreground">
          Your API key will only be valid for this app.
        </p>
      </div>
      <GenerateApiKey
        generateApiKey={async name =>
          (await generateApiKey({ echoAppId: selectedAppId, name })).key
        }
        isPending={isGenerating}
        apiKey={apiKey?.key}
        disabled={!selectedAppId}
      />
    </div>
  );
};

const AppSelect = () => {
  const [apps, { fetchNextPage, hasNextPage, isFetchingNextPage }] =
    api.apps.member.list.useSuspenseInfiniteQuery(
      {},
      {
        getNextPageParam: lastPage => lastPage.page + 1,
      }
    );

  return (
    <SelectContent
      onScroll={e => {
        const target = e.currentTarget;
        if (
          target.scrollTop + target.clientHeight >= target.scrollHeight - 10 &&
          hasNextPage
        ) {
          fetchNextPage();
        }
      }}
    >
      {apps.pages
        .flatMap(page => page.items)
        .map(app => (
          <SelectItem key={app.echoApp.id} value={app.echoApp.id}>
            <div className="flex items-center gap-2">
              <UserAvatar
                src={app.echoApp.profilePictureUrl}
                fallback={<Code className="size-4" />}
                className="bg-transparent border-none"
              />
              {app.echoApp.name}
            </div>
          </SelectItem>
        ))}
      {isFetchingNextPage && <Loader2 className="w-4 h-4 animate-spin" />}
    </SelectContent>
  );
};
