import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { JobEnvelopeSchema, JobType } from '@/services/email/emailer/types';
import { processJob as processEmailJob } from '@/services/email/emailer/process-job';
import { logger } from '@/logger';

const currentSigningKey =
  process.env.QSTASH_CURRENT_SIGNING_KEY || 'qstash-signing-key-1';
const nextSigningKey =
  process.env.QSTASH_NEXT_SIGNING_KEY || 'qstash-signing-key-2';

async function handler(request: Request) {
  const candidate = await request.json().catch(error => {
    logger.emit({
      severityText: 'ERROR',
      body: 'Failed to parse request JSON',
      attributes: {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    return null;
  });

  if (!candidate) {
    return Response.json(
      { success: false, error: 'Invalid JSON' },
      { status: 400 }
    );
  }

  const parsed = JobEnvelopeSchema.safeParse(candidate);
  if (!parsed.success) {
    logger.emit({
      severityText: 'ERROR',
      body: 'Schema validation failed',
      attributes: {
        errors: parsed.error.format(),
      },
    });
    return Response.json(
      { success: false, error: parsed.error.format() },
      { status: 400 }
    );
  }

  const envelope = parsed.data;

  switch (envelope.type) {
    case JobType.EMAIL: {
      const result = await processEmailJob(envelope.job).catch(error => {
        logger.emit({
          severityText: 'ERROR',
          body: 'Email job processing failed',
          attributes: {
            error: error.message,
          },
        });
        return { success: false, error: error.message };
      });

      if (result && 'success' in result && !result.success) {
        return Response.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }
      return Response.json({ success: true });
    }
    default: {
      logger.emit({
        severityText: 'ERROR',
        body: 'Unsupported job type received',
        attributes: {
          jobType: envelope.type,
        },
      });
      return Response.json(
        { success: false, error: 'Unsupported job type' },
        { status: 400 }
      );
    }
  }
}

export const POST = verifySignatureAppRouter(handler, {
  currentSigningKey,
  nextSigningKey,
});
