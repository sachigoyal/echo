import { serverTRPC } from '@/server/trpc-server';
import PopularAppsPage from '../PopularAppsPage';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';

/**
 * Server component wrapper for PopularAppsPage
 * Prefetches data on the server for SSR
 */
export async function PopularAppsPageServer() {
  const queryClient = new QueryClient();
  const caller = await serverTRPC();

  // Prefetch the public apps data
  await queryClient.prefetchQuery({
    queryKey: ['apps', 'getAllPublicApps', { page: 1, limit: 100 }],
    queryFn: () => caller.apps.getAllPublicApps({ page: 1, limit: 100 }),
    staleTime: 0,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PopularAppsPage />
    </HydrationBoundary>
  );
}
