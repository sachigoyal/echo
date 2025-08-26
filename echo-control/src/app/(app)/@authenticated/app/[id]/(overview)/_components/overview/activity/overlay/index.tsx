import { Overlay } from './overlay';

import { api } from '@/trpc/server';

interface Props {
  appId: string;
}

export const ActivityOverlay: React.FC<Props> = async ({ appId }) => {
  const numTokens = await api.apps.app.getNumTokens({ appId });

  if (numTokens > 0) {
    return null;
  }

  return <Overlay appId={appId} initialNumTokens={numTokens} />;
};
