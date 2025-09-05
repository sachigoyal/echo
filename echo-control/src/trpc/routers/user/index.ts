import {
  createTRPCRouter,
  protectedProcedure,
  timeBasedPaginatedProcedure,
} from '../../trpc';

import { userBalanceRouter } from './balance';
import { userApiKeysRouter } from './api-keys';
import { userPaymentsRouter } from './payments';
import { userRedeemCodeRouter } from './redeem';
import { userEarningsRouter } from './earnings';
import { userReferralRouter } from './referral';
import { userPublicRouter } from './public';
import { getUserFeed, userFeedSchema } from '@/services/feed/feed';
import { getUser } from '@/services/user';

export const userRouter = createTRPCRouter({
  balance: userBalanceRouter,
  apiKeys: userApiKeysRouter,
  payments: userPaymentsRouter,
  redeem: userRedeemCodeRouter,
  earnings: userEarningsRouter,
  referral: userReferralRouter,
  public: userPublicRouter,

  current: {
    get: protectedProcedure.query(async ({ ctx }) => {
      return getUser(ctx.session.user.id);
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
