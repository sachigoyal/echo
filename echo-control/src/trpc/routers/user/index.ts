import { createTRPCRouter } from '../../trpc';

import { userBalanceRouter } from './balance';
import { userApiKeysRouter } from './api-keys';
import { userPaymentsRouter } from './payments';
import { userRedeemCodeRouter } from './redeem';
import { userEarningsRouter } from './earnings';
import { userReferralRouter } from './referral';
import { userPublicRouter } from './public';
import { userPayoutRouter } from './payout';
import { userGithubLinkRouter } from './github-link';

export const userRouter = createTRPCRouter({
  balance: userBalanceRouter,
  apiKeys: userApiKeysRouter,
  payments: userPaymentsRouter,
  redeem: userRedeemCodeRouter,
  earnings: userEarningsRouter,
  referral: userReferralRouter,
  public: userPublicRouter,
  payout: userPayoutRouter,
  githubLink: userGithubLinkRouter,
});
