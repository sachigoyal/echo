import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../../trpc';
import {
  calculateEarningsForUser,
  calculateEarningsBreakdownForApp,
} from '@/lib/earnings';
import { PermissionService } from '@/lib/permissions/service';
import { Permission } from '@/lib/permissions/types';

export const userEarningsRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    return calculateEarningsForUser(ctx.session.user.id);
  }),

  getAppEarningsBreakdown: protectedProcedure
    .input(z.object({ appId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if user has permission to view analytics/earnings for this app
      const hasPermission = await PermissionService.hasPermission(
        userId,
        input.appId,
        Permission.VIEW_ANALYTICS
      );

      if (!hasPermission) {
        throw new Error('Permission denied: Cannot view earnings for this app');
      }

      return await calculateEarningsBreakdownForApp(input.appId);
    }),
});
