import z from 'zod';

import { authorizeParamsSchema as authorizeParamsSchemaBase } from '@/app/(auth)/(oauth)/_lib/authorize';

export const authorizeParamsSchema = authorizeParamsSchemaBase.extend({
  referral_code: z.string().optional(),
});

export type AuthorizeParams = z.infer<typeof authorizeParamsSchema>;
