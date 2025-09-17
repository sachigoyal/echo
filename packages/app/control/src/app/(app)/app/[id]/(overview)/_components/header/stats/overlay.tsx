import React from 'react';

import { Lock } from 'lucide-react';

import { useAppConnectionSetup } from '../../../../_hooks/use-app-setup';

import { api } from '@/trpc/client';

interface Props {
  appId: string;
}

export const StatsOverlay: React.FC<Props> = ({ appId }) => {
  const [isOwner] = api.apps.app.isOwner.useSuspenseQuery(appId);

  const { isConnectionComplete } = useAppConnectionSetup(appId);

  if (isConnectionComplete) return null;

  return (
    <div className="absolute inset-0 backdrop-blur-xs flex md:flex-col items-center justify-center text-muted-foreground gap-2 rounded-b-lg md:rounded-b-none md:rounded-r-lg">
      <Lock className="size-4 md:size-8" />
      <p className="text-sm max-w-[200px] text-center">
        {isOwner
          ? 'Complete setup to unlock'
          : 'The owner of this app has not completed setup'}
      </p>
    </div>
  );
};
