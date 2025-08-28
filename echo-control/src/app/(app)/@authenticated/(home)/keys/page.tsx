import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

import { Heading, Body } from '../../_components/layout/page-utils';

import { api, HydrateClient } from '@/trpc/server';

import { Keys } from './_components/keys';

import { GenerateKeyWithSelect } from './_components/generate-key';

export default async function KeysPage() {
  api.user.apiKeys.list.prefetchInfinite({});
  api.apps.list.member.prefetchInfinite({});

  return (
    <HydrateClient>
      <Heading
        title="API Keys"
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="turbo">Generate Key</Button>
            </DialogTrigger>
            <DialogContent className="p-0 overflow-hidden">
              <DialogHeader className="p-4 pb-0">
                <DialogTitle>Generate API Key</DialogTitle>
                <DialogDescription>
                  API Keys are scoped to a specific app and can only be used to
                  authenticate with that app.
                </DialogDescription>
              </DialogHeader>
              <div className="w-full max-w-full overflow-hidden p-4 pt-0">
                <GenerateKeyWithSelect />
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <Body>
        <Keys />
      </Body>
    </HydrateClient>
  );
}
