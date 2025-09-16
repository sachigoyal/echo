import { Button } from '@/components/ui/button';

import { UseAppButton } from '../use-app-button';

import { api } from '@/trpc/client';

interface Props {
  appId: string;
}

export const ViewerButtons: React.FC<Props> = ({ appId }) => {
  const [app] = api.apps.app.get.useSuspenseQuery({ appId });

  if (!app.homepageUrl) {
    return (
      <Button variant="outline" disabled>
        No App Url
      </Button>
    );
  }

  return <UseAppButton homepageUrl={app.homepageUrl} />;
};
