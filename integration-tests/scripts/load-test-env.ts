import { config } from 'dotenv';
import { resolve } from 'path';

export function loadIntegrationTestEnv() {
  console.log('🔧 Loading integration test environment...');

  // Load in order of precedence (last one wins)
  const envFiles = [
    '.env.integration', // Default integration settings
    '.env.integration.local', // Local overrides (gitignored)
    '.env.integration.ci', // CI-specific overrides
  ];

  for (const envFile of envFiles) {
    const envPath = resolve(process.cwd(), envFile);
    try {
      config({ path: envPath });
      console.log(`✅ Loaded ${envFile}`);
    } catch (error) {
      console.log(`⚠️  ${envFile} not found (optional)`);
    }
  }

  // Validate required environment variables
  const requiredVars = [
    'DATABASE_URL',
    'ECHO_CONTROL_URL',
    'JWT_SECRET',
    'CLERK_SECRET_KEY',
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  console.log('✅ All required environment variables loaded');
  console.log(`🎯 Echo Control URL: ${process.env.ECHO_CONTROL_URL}`);
  console.log(
    `🗄️  Database: ${process.env.DATABASE_URL?.split('@')[1] || 'Unknown'}`
  );
}

// Auto-load when imported
if (typeof require !== 'undefined' && require.main === module) {
  loadIntegrationTestEnv();
}
