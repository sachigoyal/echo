import { useState } from 'react';
import { GenerateApiKey } from '../../_components/generate-key';
import { api } from '@/trpc/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

export const GenerateKeyWithSelect = () => {
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [apps, { fetchNextPage, hasNextPage }] =
    api.apps.public.list.useSuspenseInfiniteQuery(
      {},
      {
        getNextPageParam: (lastPage, pages) => (lastPage as any).page + 1,
      }
    );

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="app-select"
          className="block text-sm font-medium text-card-foreground mb-2"
        >
          Select Echo App <span className="text-red-500">*</span>
        </label>
        <Select value={selectedAppId} onValueChange={setSelectedAppId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose an app" />
          </SelectTrigger>
          <SelectContent>
            {apps.pages.flat().map(app => (
              <SelectItem key={app.id} value={app.id}>
                {app.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {apps.pages.flat().length === 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            No apps found. Create an app first in your{' '}
            <Link href="/" className="text-accent hover:underline">
              dashboard
            </Link>
            .
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          {selectedAppId
            ? 'This app was pre-selected from your invitation link.'
            : 'API keys are scoped to specific apps and can only access resources for the selected app.'}
        </p>
      </div>

      <GenerateApiKey echoAppId={selectedAppId} />
    </div>
  );
};
