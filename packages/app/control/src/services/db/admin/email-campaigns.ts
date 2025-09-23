import { db } from '@/services/db/client';
import { queueJob } from '@/services/email/queue';
import { EmailType } from '../../email/emails/types';

type CampaignLabel = {
  key: string;
  label: string;
  description?: string;
};

const AVAILABLE_EMAIL_CAMPAIGNS: CampaignLabel[] = [
  { key: EmailType.LIMBO_APP_REMINDER, label: 'Limbo App Reminder' },
  { key: EmailType.CREATE_APP_FOLLOW_UP, label: 'Create App Follow-Up' },
];

function isValidEmailCampaign(key: string): key is EmailType {
  return (Object.values(EmailType) as string[]).includes(key);
}

export function listAvailableEmailCampaigns(): CampaignLabel[] {
  return AVAILABLE_EMAIL_CAMPAIGNS;
}

export async function getSentCampaignsForApps(appIds: string[]) {
  if (!appIds.length) return {} as Record<string, string[]>;

  const records = await db.outboundEmailSent.findMany({
    where: { echoAppId: { in: appIds } },
    select: { echoAppId: true, emailCampaignId: true },
  });

  const appIdToCampaigns = new Map<string, Set<string>>();
  for (const rec of records) {
    if (!rec.echoAppId) continue;
    const set = appIdToCampaigns.get(rec.echoAppId) ?? new Set<string>();
    set.add(rec.emailCampaignId);
    appIdToCampaigns.set(rec.echoAppId, set);
  }

  const result: Record<string, string[]> = {};
  for (const appId of appIds) {
    result[appId] = Array.from(appIdToCampaigns.get(appId) ?? []);
  }
  return result;
}

export async function scheduleCampaignForApps(params: {
  campaignKey: string;
  appIds: string[];
}) {
  const { campaignKey, appIds } = params;
  const results: Array<{
    appId: string;
    status: 'scheduled' | 'skipped' | 'error';
    message?: string;
  }> = [];

  for (const appId of appIds) {
    // Fetch an owner and app info
    const membership = await db.appMembership.findFirst({
      where: { echoAppId: appId, role: 'owner', isArchived: false },
      include: { user: true, echoApp: true },
    });

    if (!membership || !membership.user || !membership.echoApp) {
      results.push({
        appId,
        status: 'error',
        message: 'Owner or app not found',
      });
      continue;
    }

    try {
      if (!isValidEmailCampaign(campaignKey)) {
        results.push({
          appId,
          status: 'error',
          message: 'Unknown campaign key',
        });
        continue;
      }

      await queueJob({
        campaign: campaignKey,
        payload: {
          userId: membership.user.id,
          appName: membership.echoApp.name,
          appId,
        },
      });

      results.push({ appId, status: 'scheduled' });
    } catch (err) {
      results.push({
        appId,
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}
