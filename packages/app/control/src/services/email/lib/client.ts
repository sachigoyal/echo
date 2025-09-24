import { Resend } from 'resend';

import { env } from '@/env';

export const emailClient = new Resend(env.AUTH_RESEND_KEY);
