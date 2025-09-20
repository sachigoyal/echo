import { Client } from '@upstash/qstash';
import { logger } from '@/logger';

declare global {
  var qstashClient: Client | undefined;
}

let qstashClient: Client;

if (process.env.NODE_ENV === 'production') {
  logger.emit({
    body: 'Initializing Prisma client in production',
    severityText: 'INFO',
  });
  qstashClient = new Client({
    // Add your token to a .env file
    token: process.env.QSTASH_TOKEN!,
    baseUrl: process.env.QSTASH_URL!,
  });
} else {
  if (!globalThis.qstashClient) {
    globalThis.qstashClient = new Client({
      token: process.env.QSTASH_TOKEN!,
      baseUrl: process.env.QSTASH_URL!,
    });
  }
  qstashClient = globalThis.qstashClient;
}

export { qstashClient };
