import { api, HydrateClient } from '@/trpc/server';
import MyAppsPage from '../MyAppsPage';

/**
 * Server component wrapper for MyAppsPage
 * Prefetches data on the server for SSR
 */
export async function MyAppsPageServer() {
  api.apps.getAllOwnerApps.prefetch({
    page: 1,
    limit: 100,
  });

  return (
    <HydrateClient>
      <MyAppsPage />
    </HydrateClient>
  );
}
