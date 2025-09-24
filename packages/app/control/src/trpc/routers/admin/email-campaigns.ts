import { z } from 'zod';

import { adminProcedure, createTRPCRouter } from '../../trpc';

import {
  listAvailableEmailCampaigns,
  getSentCampaignsForApps,
  scheduleCampaignForApps,
} from '@/services/db/admin/email-campaigns';

export const adminEmailCampaignsRouter = createTRPCRouter({
  list: adminProcedure.query(async () => {
    return listAvailableEmailCampaigns();
  }),
  getSentForApps: adminProcedure
    .input(z.object({ appIds: z.array(z.string()) }))
    .query(async ({ input }) => {
      return await getSentCampaignsForApps(input.appIds);
    }),
  scheduleForApps: adminProcedure
    .input(
      z.object({
        campaignKey: z.string(),
        appIds: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      return await scheduleCampaignForApps(input);
    }),
});
