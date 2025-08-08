import { api, HydrateClient } from '@/trpc/server';
import MemberAppsPage from '../MemberAppsPage';

/**
 * Server component wrapper for MemberAppsPage
 * Prefetches data on the server for SSR
 */
export async function MemberAppsPageServer() {
  api.apps.getAllCustomerApps.prefetch({
    page: 1,
    limit: 100,
  });

  return (
    <HydrateClient>
      <MemberAppsPage />
    </HydrateClient>
  );
}
