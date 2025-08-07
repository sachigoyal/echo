import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { auth } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { ZodError } from 'zod';
import { db } from '@/lib/db';

/**
 * Context that is passed to all TRPC procedures
 */
export interface Context {
  userId: string | null;
  auth: Awaited<ReturnType<typeof auth>>;
  headers: Headers;
}

/**
 * Create context for each request
 */
export async function createContext(): Promise<Context> {
  const authResult = await auth();
  const requestHeaders = await headers();

  // Get the actual database user ID from the Clerk ID
  let dbUserId: string | null = null;
  if (authResult.userId) {
    const user = await db.user.findUnique({
      where: { clerkId: authResult.userId },
      select: { id: true },
    });
    dbUserId = user?.id || null;
  }

  return {
    userId: dbUserId,
    auth: authResult,
    headers: requestHeaders,
  };
}

/**
 * Initialize TRPC with our context and transformer
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Export reusable router and procedure helpers
 */
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

/**
 * Protected procedure that requires authentication
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});

/**
 * Middleware for rate limiting, logging, etc.
 */
export const middleware = t.middleware;
