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
} from '@/lib/api-keys';
import { createTRPCRouter, protectedProcedure } from '../../trpc';

export const userApiKeysRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return listApiKeys(ctx.session.user.id);
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
