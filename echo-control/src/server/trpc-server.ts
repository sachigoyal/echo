import 'server-only';
import { headers } from 'next/headers';
import { cache } from 'react';
import { createCallerFactory } from './trpc';
import { appRouter } from './routers';
import { auth } from '@/auth';

/**
 * Create a server-side caller for TRPC procedures
 * This is cached per request in React Server Components
 */
export const createServerCaller = cache(async () => {
  const session = await auth();
  const requestHeaders = await headers();

  const createCaller = createCallerFactory(appRouter);

  return createCaller({
    session,
    headers: requestHeaders,
  });
});

/**
 * Pre-configured server caller for use in React Server Components
 */
export async function serverTRPC() {
  return createServerCaller();
}
