import { Code, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { UserAvatar } from '@/components/utils/user-avatar';

interface Key {
  id: string;
  name: string | null;
  createdAt: Date;
  echoApp: {
    id: string;
    name: string;
    profilePictureUrl: string | null;
  };
}

interface Props {
  keys: Key[];
  hasNext: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
}

export const KeysList = ({
  keys,
  hasNext,
  fetchNextPage,
  isFetchingNextPage,
}: Props) => {
  if (keys.length === 0) {
    return (
      <div className="text-center py-8 flex items-center justify-center h-full">
        <p className="text-muted-foreground">No keys found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {keys.map(key => (
        <div key={key.id} className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {key.name ?? 'Unnamed'}
            </p>
            <div className="flex items-center gap-1">
              <UserAvatar
                className="size-4 border-none bg-transparent"
                src={key.echoApp.profilePictureUrl}
                fallback={<Code className="size-3" />}
              />
              <p className="text-xs text-muted-foreground">
                {key.echoApp.name}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {key.createdAt.toLocaleString(undefined, {
              dateStyle: 'short',
              timeStyle: 'short',
            })}
          </p>
        </div>
      ))}

      {hasNext && (
        <div className="flex justify-center">
          <Button
            onClick={() => {
              fetchNextPage();
            }}
            className="w-full"
            variant="ghost"
            disabled={isFetchingNextPage}
            size="sm"
          >
            {isFetchingNextPage ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'Load more'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
