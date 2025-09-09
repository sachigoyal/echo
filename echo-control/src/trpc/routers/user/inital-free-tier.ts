import { createTRPCRouter, protectedProcedure } from '../../trpc';
import { issueInitialFreeTierCredits } from '@/services/user/initial-free-tier';

export const userInitialFreeTierRouter = createTRPCRouter({
  issue: protectedProcedure.mutation(async ({ ctx }) => {
    return await issueInitialFreeTierCredits(ctx.session.user.id);
  }),
});


