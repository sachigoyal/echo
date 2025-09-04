import { api } from '@/trpc/server';
import { AppRow, LoadingAppRow } from './item';

export const AppRows = async () => {
  const apps = await api.apps.list.owner({});

  const rows = apps.items;

  if (rows.length === 0) {
    return (
      <div className="w-full flex flex-col gap-2 md:gap-3 p-2">
        <p className="text-xs text-muted-foreground/60">
          No activity on your apps yet
        </p>
      </div>
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
