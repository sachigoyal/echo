import Link from 'next/link';

import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { RouterOutputs } from '@/trpc/client';

import { AppRow, LoadingAppRow } from './item';

interface Props {
  appsPromise: Promise<RouterOutputs['apps']['list']['owner']>;
}

export const AppRows: React.FC<Props> = async ({ appsPromise }) => {
  const apps = await appsPromise;

  const rows = apps.items;

  if (rows.length === 0) {
    return (
      <>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Create your First App
          </CardTitle>
          <CardDescription className="text-xs">
            Ready to get started? This will take you less than 2 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/new" className="w-full">
            <Button variant="turbo" className="w-full">
              Create App
            </Button>
          </Link>
        </CardContent>
      </>
    );
  }

  return (
    <>
      {rows.map(item => (
        <AppRow key={item.id} app={item} />
      ))}
      {/* {apps.has_next && (
        <Button
          onClick={() => apps.next()}
          variant="ghost"
          disabled={apps.is_fetching_next}
          className="w-full h-fit py-1 text-xs text-muted-foreground/60 rounded-none"
        >
          {isFetchingNextPage ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            'Load more'
          )}
        </Button>
      )} */}
    </>
  );
};

export const LoadingAppRows = () => {
  return (
    <>
      {Array.from({ length: 1 }).map((_, index) => (
        <LoadingAppRow key={index} />
      ))}
    </>
  );
};
