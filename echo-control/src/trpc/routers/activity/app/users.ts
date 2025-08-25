import {
  listAppUsersActivity,
  listAppUsersActivitySchema,
} from '@/services/activity/app/users';
import {
  createTRPCRouter,
  paginatedProcedure,
  protectedProcedure,
} from '../../../trpc';

export const appUsersRouter = createTRPCRouter({
  list: paginatedProcedure
    .concat(protectedProcedure)
    .input(listAppUsersActivitySchema)
    .query(async ({ ctx: { pagination }, input }) => {
      return listAppUsersActivity(input, pagination);
    }),
});
