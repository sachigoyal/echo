import { createTRPCRouter, protectedProcedure, publicProcedure } from '../../trpc';
import { acceptLatestPrivacyPolicy, acceptLatestTermsAndServices } from '@/services/user/terms-agreement';

export const userTermsAgreementRouter = createTRPCRouter({
  acceptTerms: protectedProcedure.mutation(async ({ ctx }) => {
    return await acceptLatestTermsAndServices(ctx.session.user.id);
  }),

  acceptPrivacy: protectedProcedure.mutation(async ({ ctx }) => {
    return await acceptLatestPrivacyPolicy(ctx.session.user.id);
  }),

  needs: createTRPCRouter({
    terms: protectedProcedure.query(async ({ ctx }) => {
      return await acceptLatestTermsAndServices(ctx.session.user.id);
    }),
    privacy: protectedProcedure.query(async ({ ctx }) => {
      return await acceptLatestPrivacyPolicy(ctx.session.user.id);
    }),
  }),
});


