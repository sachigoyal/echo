import {
  createTRPCRouter,
  paginatedProcedure,
  protectedProcedure,
  timeBasedPaginatedProcedure,
} from '../../trpc';

import { userBalanceRouter } from './balance';
import { userApiKeysRouter } from './api-keys';
import { userRedeemCodeRouter } from './redeem';
import { userPublicRouter } from './public';
import { userPayoutRouter } from './payout';
import { userGithubLinkRouter } from './github-link';
import { userInitialFreeTierRouter } from './inital-free-tier';
import { userTermsAgreementRouter } from './terms-agreement';

import { getUserFeed, userFeedSchema } from '@/services/feed/feed';
import { getUser } from '@/services/user';
import { listCreditPayments } from '@/services/payments';
import { createPaymentLink, createPaymentLinkSchema } from '@/services/stripe';

export const userRouter = createTRPCRouter({
  balance: userBalanceRouter,
  apiKeys: userApiKeysRouter,
  redeem: userRedeemCodeRouter,
  public: userPublicRouter,
  payout: userPayoutRouter,
  githubLink: userGithubLinkRouter,
  initialFreeTier: userInitialFreeTierRouter,
  termsAgreement: userTermsAgreementRouter,

  current: {
    get: protectedProcedure.query(async ({ ctx }) => {
      return getUser(ctx.session.user.id);
    }),
  },

  payments: {
    list: paginatedProcedure
      .concat(protectedProcedure)
      .query(async ({ ctx }) => {
        return await listCreditPayments(ctx.session.user.id, ctx.pagination);
      }),

    createLink: protectedProcedure
      .input(createPaymentLinkSchema)
      .mutation(async ({ ctx, input }) => {
        return await createPaymentLink(ctx.session.user.id, input);
      }),
  },

  feed: {
    list: timeBasedPaginatedProcedure
      .concat(protectedProcedure)
      .input(userFeedSchema)
      .query(async ({ ctx, input }) => {
        return getUserFeed(ctx.session.user.id, input, ctx.pagination);
      }),
  },
});
