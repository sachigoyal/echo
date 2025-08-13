import { createTRPCRouter } from '../../trpc';

import { userBalanceRouter } from './balance';
import { userApiKeysRouter } from './api-keys';
import { userPaymentsRouter } from './payments';

export const userRouter = createTRPCRouter({
  balance: userBalanceRouter,
  apiKeys: userApiKeysRouter,
  payments: userPaymentsRouter,
});
