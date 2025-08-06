import 'server-only';
import { headers } from 'next/headers';
import { cache } from 'react';
import { createCallerFactory } from './trpc';
import { appRouter } from './routers';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

/**
 * Create a server-side caller for TRPC procedures
 * This is cached per request in React Server Components
 */
export const createServerCaller = cache(async () => {
  const authResult = await auth();
  const clerkUserId = authResult.userId;
  const requestHeaders = await headers();

  // Get the actual database user ID from the Clerk ID
  let dbUserId: string | null = null;
  if (clerkUserId) {
    const user = await db.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });
    dbUserId = user?.id || null;
  }

  const createCaller = createCallerFactory(appRouter);

  return createCaller({
    userId: dbUserId,
    auth: authResult,
    headers: requestHeaders,
  });
});

/**
 * Pre-configured server caller for use in React Server Components
 */
export async function serverTRPC() {
  return createServerCaller();
}
