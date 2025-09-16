import React from 'react';

import { Settings, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SetupApp } from './setup-app';
import { api } from '@/trpc/client';
import { useAppConnectionSetup } from '../../../../_hooks/use-app-setup';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  appId: string;
}

export const HeaderButtons: React.FC<Props> = ({ appId }) => {
  const [isOwner] = api.apps.app.isOwner.useSuspenseQuery(appId);

  return (
    <div className="flex items-center gap-2">
      {isOwner ? (
        <OwnerButtons appId={appId} />
      ) : (
        <ViewerButtons appId={appId} />
      )}
    </div>
  );
};

export const LoadingHeaderButtons = () => {
  return <Skeleton className="w-24 h-9" />;
};

const OwnerButtons: React.FC<Props> = ({ appId }) => {
  const { isConnectionComplete } = useAppConnectionSetup(appId);

  return (
    <>
      {isConnectionComplete ? <SetupApp appId={appId} /> : null}
      <Link href={`/app/${appId}/settings/general`}>
        <Button variant="outline">
          <Settings className="size-4" />
          App Settings
        </Button>
      </Link>
    </>
  );
};

const ViewerButtons: React.FC<Props> = ({ appId }) => {
  const [app] = api.apps.app.get.useSuspenseQuery({ appId });

  if (!app.homepageUrl) {
    return (
      <Button variant="outline" disabled>
        No App Url
      </Button>
    );
  }

  return (
    <a href={app.homepageUrl} target="_blank">
      <Button variant="turbo">
        <Zap className="size-4" />
        Use App
      </Button>
    </a>
  );
};
