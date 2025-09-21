import { searchUsers } from '@/services/github/users';
import z from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const githubRouter = createTRPCRouter({
  searchUsers: publicProcedure
    .input(z.object({ q: z.string().min(1) }))
    .query(async ({ input }) => {
      const res = await searchUsers(input.q);
      return res;
    }),
});
