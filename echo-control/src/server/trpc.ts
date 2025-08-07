import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { headers } from 'next/headers';
import { ZodError } from 'zod';
import { auth } from '@/auth';
import { Session } from 'next-auth';

/**
 * Context that is passed to all TRPC procedures
 */
export interface Context {
  session: Session | null;
  headers: Headers;
}

/**
 * Create context for each request
 */
export async function createContext(): Promise<Context> {
  const session = await auth();
  const requestHeaders = await headers();

  return {
    session,
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
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * Middleware for rate limiting, logging, etc.
 */
export const middleware = t.middleware;
