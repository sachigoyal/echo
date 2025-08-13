import {
  createApiKey,
  createApiKeySchema,
  deleteApiKey,
  deleteApiKeySchema,
  getApiKey,
  getApiKeySchema,
  listApiKeys,
  updateApiKey,
  updateApiKeySchema,
} from '@/services/api-keys';
import { createTRPCRouter, protectedProcedure } from '../../trpc';
import { infiniteQueryPaginationParamsSchema } from '@/trpc/lib/infinite-query';

export const userApiKeysRouter = createTRPCRouter({
  list: protectedProcedure
    .input(infiniteQueryPaginationParamsSchema)
    .query(async ({ ctx, input }) => {
      return listApiKeys(ctx.session.user.id, input);
    }),

  get: protectedProcedure
    .input(getApiKeySchema)
    .query(async ({ ctx, input }) => {
      return getApiKey(ctx.session.user.id, input);
    }),

  create: protectedProcedure
    .input(createApiKeySchema)
    .mutation(async ({ ctx, input }) => {
      return createApiKey(ctx.session.user.id, input);
    }),

  update: protectedProcedure
    .input(updateApiKeySchema)
    .mutation(async ({ ctx, input }) => {
      return updateApiKey(ctx.session.user.id, input);
    }),

  delete: protectedProcedure
    .input(deleteApiKeySchema)
    .mutation(async ({ ctx, input }) => {
      return deleteApiKey(ctx.session.user.id, input);
    }),
});
