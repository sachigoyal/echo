import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
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
export async function createTRPCContext(headers: Headers): Promise<Context> {
  const session = await auth();

  return {
    session,
    headers,
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

// ----------------------------
// Export reusable router and procedure helpers
// ----------------------------

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;
export const middleware = t.middleware;

// ----------------------------
// Procedures
// ----------------------------

/**
 * Public procedure that does not require authentication
 */
export const publicProcedure = t.procedure;

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
