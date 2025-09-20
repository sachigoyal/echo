import { NextResponse } from 'next/server';

import z from 'zod';

import {
  processJob as processEmailJob,
  emailJobSchema,
} from '@/services/email/queue';

import { createZodRoute } from '@/lib/api/create-route';

import { queueRoute } from '@/services/queue/route';

enum JobType {
  EMAIL = 'email',
}

const jobBodySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(JobType.EMAIL),
    job: emailJobSchema,
  }),
]);

export const POST = queueRoute(
  createZodRoute()
    .body(jobBodySchema)
    .handler(async (_, { body }) => {
      const envelope = body;

      switch (envelope.type) {
        case JobType.EMAIL: {
          processEmailJob(envelope.job);
          return NextResponse.json({ success: true });
        }
      }
    })
);
