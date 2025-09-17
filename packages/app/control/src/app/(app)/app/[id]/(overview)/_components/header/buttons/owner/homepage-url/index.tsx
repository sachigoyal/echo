import { api } from '@/trpc/client';
import { UseAppButton } from '../../use-app-button';
import { AddHomepageUrl } from './add-homepage-url';

interface Props {
  appId: string;
}

export const HomepageUrl: React.FC<Props> = ({ appId }) => {
  const [app] = api.apps.app.get.useSuspenseQuery({ appId });

  if (app.homepageUrl) {
    return <UseAppButton homepageUrl={app.homepageUrl} />;
  }

  return <AddHomepageUrl appId={appId} />;
};
