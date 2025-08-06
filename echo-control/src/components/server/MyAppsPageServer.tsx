import { serverTRPC } from '@/server/trpc-server';
import MyAppsPage from '../MyAppsPage';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';

/**
 * Server component wrapper for MyAppsPage
 * Prefetches data on the server for SSR
 */
export async function MyAppsPageServer() {
  const queryClient = new QueryClient();
  const caller = await serverTRPC();

  // Prefetch the owner apps data
  await queryClient.prefetchQuery({
    queryKey: ['apps', 'getAllOwnerApps', { page: 1, limit: 100 }],
    queryFn: () => caller.apps.getAllOwnerApps({ page: 1, limit: 100 }),
    staleTime: 0,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MyAppsPage />
    </HydrationBoundary>
  );
}
