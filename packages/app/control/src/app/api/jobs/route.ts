import { NextResponse } from 'next/server';

import z from 'zod';

import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';

import {
  processJob as processEmailJob,
  emailJobSchema,
} from '@/services/email/queue';

import { env } from '@/env';
import { createZodRoute } from '@/lib/api/create-route';

enum JobType {
  EMAIL = 'email',
}

export const jobBodySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(JobType.EMAIL),
    job: emailJobSchema,
  }),
]);

const handler = createZodRoute()
  .body(jobBodySchema)
  .handler(async (_, { body }) => {
    const envelope = body;

    switch (envelope.type) {
      case JobType.EMAIL: {
        processEmailJob(envelope.job);
        return NextResponse.json({ success: true });
      }
    }
  });

export const POST = verifySignatureAppRouter(handler, {
  currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
});
