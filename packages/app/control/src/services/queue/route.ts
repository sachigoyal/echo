import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';

import { env } from '@/env';

export const queueRoute = (
  handler: Parameters<typeof verifySignatureAppRouter>[0]
) =>
  verifySignatureAppRouter(handler, {
    currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
  });
