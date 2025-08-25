import {
  createTRPCRouter,
  paginatedProcedure,
  publicProcedure,
} from '../../trpc';
import { TRPCError } from '@trpc/server';
import {
  getAppOwner,
  getPublicApp,
  getPublicAppAuthorizedCallbackUrls,
  getPublicAppMarkup,
  getPublicAppSchema,
  listPublicApps,
  listPublicAppsSchema,
} from '@/services/apps/public';

export const publicAppsRouter = createTRPCRouter({
  get: publicProcedure.input(getPublicAppSchema).query(async ({ input }) => {
    const app = await getPublicApp(input);
    if (!app) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'App not found',
      });
    }

    return app;
  }),

  list: paginatedProcedure
    .concat(publicProcedure)
    .input(listPublicAppsSchema)
    .query(async ({ ctx: { pagination }, input }) => {
      return await listPublicApps(input, pagination);
    }),

  owner: publicProcedure.input(getPublicAppSchema).query(async ({ input }) => {
    const owner = await getAppOwner(input);
    if (!owner) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Owner not found',
      });
    }
    return owner;
  }),

  markup: publicProcedure.input(getPublicAppSchema).query(async ({ input }) => {
    const markup = await getPublicAppMarkup(input);
    if (!markup) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Markup not found',
      });
    }

    return markup;
  }),

  authorizedCallbackUrls: publicProcedure
    .input(getPublicAppSchema)
    .query(async ({ input }) => {
      const authorizedCallbackUrls =
        await getPublicAppAuthorizedCallbackUrls(input);
      if (!authorizedCallbackUrls) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'App not found',
        });
      }

      return authorizedCallbackUrls;
    }),
});
