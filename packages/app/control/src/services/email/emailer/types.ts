import { z } from 'zod';
import { limboAppReminderEmailSchema } from '../limbo-app-reminder';
import { createAppFollowUpEmailSchema } from '../create-app';

export enum JobType {
  EMAIL = 'email',
}

export enum EmailCampaign {
  LIMBO_APP_REMINDER = 'limbo-app-reminder',
  CREATE_APP_FOLLOW_UP = 'create-app-follow-up',
}

export const EmailJobPayloadSchema = z.discriminatedUnion('campaign', [
  z.object({
    campaign: z.literal(EmailCampaign.LIMBO_APP_REMINDER),
    payload: limboAppReminderEmailSchema,
  }),
  z.object({
    campaign: z.literal(EmailCampaign.CREATE_APP_FOLLOW_UP),
    payload: createAppFollowUpEmailSchema,
  }),
]);

export type EmailJobPayload = z.infer<typeof EmailJobPayloadSchema>;

export const JobEnvelopeSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(JobType.EMAIL),
    job: EmailJobPayloadSchema,
  }),
]);

export type JobEnvelope = z.infer<typeof JobEnvelopeSchema>;