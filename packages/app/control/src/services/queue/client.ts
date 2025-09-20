import { Client } from '@upstash/qstash';

import { logger } from '@/logger';
import { env } from '@/env';

declare global {
  var queueClient: Client | undefined;
}

let queueClient: Client;

if (env.NODE_ENV === 'production') {
  logger.emit({
    body: 'Initializing Qstash client in production',
    severityText: 'INFO',
  });
  queueClient = new Client({
    // Add your token to a .env file
    token: env.QSTASH_TOKEN,
  });
} else {
  globalThis.queueClient ??= new Client({
    token: env.QSTASH_TOKEN,
  });
  queueClient = globalThis.queueClient;
}

export { queueClient };
