import { api, HydrateClient } from '@/trpc/server';
import PopularAppsPage from '../PopularAppsPage';

/**
 * Server component wrapper for PopularAppsPage
 * Prefetches data on the server for SSR
 */
export async function PopularAppsPageServer() {
  api.apps.getAllPublicApps.prefetch({
    page: 1,
    limit: 100,
  });

  return (
    <HydrateClient>
      <PopularAppsPage />
    </HydrateClient>
  );
}
