import { Card } from '@/components/ui/card';

import { api, HydrateClient } from '@/trpc/server';

import { GenerateKeyWithSelect } from './_components/generate-key';

export default async function CLIAuthPage() {
  await api.apps.member.list.prefetchInfinite({});

  return (
    <HydrateClient>
      <div className="flex flex-col gap-8 pt-2 w-full">
        <p className="text-muted-foreground text-center">
          Generate an API key to authenticate with the Echo in your CLI App
        </p>
        <Card className="p-4">
          <GenerateKeyWithSelect />
        </Card>
      </div>
    </HydrateClient>
  );
}
