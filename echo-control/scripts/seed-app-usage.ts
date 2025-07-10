#!/usr/bin/env tsx

import { PrismaClient } from '../src/generated/prisma/index.js';
import modelPrices from '../model_prices.json';
import * as crypto from 'crypto';

// Database client
const prisma = new PrismaClient();

// Available models for realistic data generation
const POPULAR_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'claude-3-opus-20240229',
  'gemini-1.5-pro-002',
  'gemini-1.5-flash-002',
];

// Provider mapping
const MODEL_PROVIDERS: Record<string, string> = {
  'gpt-4o': 'openai',
  'gpt-4o-mini': 'openai',
  'gpt-4-turbo': 'openai',
  'claude-3-5-sonnet-20241022': 'anthropic',
  'claude-3-5-haiku-20241022': 'anthropic',
  'claude-3-opus-20240229': 'anthropic',
  'gemini-1.5-pro-002': 'google',
  'gemini-1.5-flash-002': 'google',
};

// Sample prompts for realistic data
const SAMPLE_PROMPTS = [
  'Write a brief summary of the main features of React',
  'Explain how to implement authentication in a web application',
  'What are the best practices for database design?',
  'Create a simple todo list component in TypeScript',
  'How do I optimize SQL queries for better performance?',
  'Explain the difference between REST and GraphQL APIs',
  'Write a function to validate email addresses',
  'What are the security considerations for web applications?',
  'How to implement caching strategies in web development?',
  'Explain the concept of microservices architecture',
];

// Sample responses
const SAMPLE_RESPONSES = [
  "Here's a comprehensive overview of the topic you asked about...",
  'Based on best practices, I recommend the following approach...',
  'Let me break this down into key components and explain each one...',
  "Here's a practical implementation that addresses your requirements...",
  'The most effective strategy for this would be to consider...',
  "I'll provide you with a step-by-step guide to implement this...",
  'There are several important factors to consider when approaching this...',
  "Here's a detailed explanation with examples to illustrate the concept...",
  'The solution involves implementing the following key features...',
  'Let me walk you through the process with concrete examples...',
];

interface SeedOptions {
  appId?: string;
  days?: number;
  transactionsPerDay?: number;
  verbose?: boolean;
}

/**
 * Generate random number between min and max (inclusive)
 */
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random date within the last N days
 */
function randomDateWithinDays(days: number): Date {
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const randomMs = Math.random() * days * msPerDay;
  return new Date(now.getTime() - randomMs);
}

/**
 * Calculate cost for a transaction based on model and token counts
 */
function calculateTransactionCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const modelData = modelPrices[model as keyof typeof modelPrices];
  if (!modelData) {
    console.warn(
      `Model ${model} not found in pricing data, using default cost`
    );
    return (inputTokens + outputTokens) * 0.00001; // Fallback rate
  }

  const inputCost = inputTokens * (modelData.input_cost_per_token || 0);
  const outputCost = outputTokens * (modelData.output_cost_per_token || 0);
  return inputCost + outputCost;
}

/**
 * Generate a realistic transaction for an app
 */
function generateTransaction(
  appId: string,
  userId: string,
  apiKeyId: string | null,
  createdAt: Date
) {
  // Pick a random model
  const model =
    POPULAR_MODELS[Math.floor(Math.random() * POPULAR_MODELS.length)];
  const providerId = MODEL_PROVIDERS[model] || 'openai';

  // Generate realistic token counts
  const inputTokens = randomBetween(50, 2000);
  const outputTokens = randomBetween(20, 1000);
  const totalTokens = inputTokens + outputTokens;

  // Calculate cost
  const cost = calculateTransactionCost(model, inputTokens, outputTokens);

  // Pick random prompt and response
  const prompt =
    SAMPLE_PROMPTS[Math.floor(Math.random() * SAMPLE_PROMPTS.length)];
  const response =
    SAMPLE_RESPONSES[Math.floor(Math.random() * SAMPLE_RESPONSES.length)];

  // Status is mostly successful
  const status =
    Math.random() < 0.95
      ? 'completed'
      : Math.random() < 0.5
        ? 'error'
        : 'timeout';
  const errorMessage =
    status !== 'completed' ? 'Request failed due to rate limiting' : null;

  return {
    id: crypto.randomUUID(),
    providerId,
    model,
    inputTokens,
    outputTokens,
    totalTokens,
    cost,
    prompt,
    response: status === 'completed' ? response : null,
    status,
    errorMessage,
    createdAt,
    userId,
    echoAppId: appId,
    apiKeyId,
  };
}

/**
 * Get or create a test user for the app
 */
async function getOrCreateTestUser(
  appId: string
): Promise<{ userId: string; apiKeyId: string | null }> {
  // Try to find existing owner/member of the app
  const membership = await prisma.appMembership.findFirst({
    where: {
      echoAppId: appId,
      role: { in: ['owner', 'admin'] },
      status: 'active',
    },
    include: {
      user: {
        include: {
          apiKeys: {
            where: {
              echoAppId: appId,
              isActive: true,
            },
          },
        },
      },
    },
  });

  if (membership) {
    const apiKey = membership.user.apiKeys[0];
    return {
      userId: membership.userId,
      apiKeyId: apiKey?.id || null,
    };
  }

  // If no membership found, create a test user and membership
  const testUser = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      email: `test-user-${Date.now()}@example.com`,
      name: 'Test User for Seeding',
      clerkId: `test_clerk_${Date.now()}`,
      totalPaid: 0,
      totalSpent: 0,
    },
  });

  // Create membership
  await prisma.appMembership.create({
    data: {
      userId: testUser.id,
      echoAppId: appId,
      role: 'owner',
      status: 'active',
      totalSpent: 0,
    },
  });

  // Create an API key
  const apiKey = await prisma.apiKey.create({
    data: {
      id: crypto.randomUUID(),
      keyHash: crypto
        .createHmac('sha256', 'test-secret')
        .update(`test-key-${Date.now()}`)
        .digest('hex'),
      name: 'Seeded Test Key',
      userId: testUser.id,
      echoAppId: appId,
      scope: 'owner',
      isActive: true,
    },
  });

  return {
    userId: testUser.id,
    apiKeyId: apiKey.id,
  };
}

/**
 * Seed usage data for a specific app
 */
async function seedAppUsage(
  appId: string,
  options: SeedOptions
): Promise<number> {
  const { days = 30, transactionsPerDay = 50, verbose = false } = options;

  if (verbose) {
    console.log(`🌱 Seeding usage data for app: ${appId}`);
  }

  // Verify app exists
  const app = await prisma.echoApp.findUnique({
    where: { id: appId },
  });

  if (!app) {
    throw new Error(`App with ID ${appId} not found`);
  }

  // Get or create test user for this app
  const { userId, apiKeyId } = await getOrCreateTestUser(appId);

  // Generate transactions
  const transactions = [];
  for (let day = 0; day < days; day++) {
    // Variable number of transactions per day (some days more active than others)
    const dayTransactions = randomBetween(
      Math.floor(transactionsPerDay * 0.5),
      Math.floor(transactionsPerDay * 1.5)
    );

    for (let i = 0; i < dayTransactions; i++) {
      const createdAt = randomDateWithinDays(days - day);
      transactions.push(
        generateTransaction(appId, userId, apiKeyId, createdAt)
      );
    }
  }

  // Sort by creation date for more realistic insertion
  transactions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  // Insert transactions in batches
  const batchSize = 100;
  let totalInserted = 0;

  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);
    await prisma.llmTransaction.createMany({
      data: batch,
    });
    totalInserted += batch.length;

    if (verbose && totalInserted % 500 === 0) {
      console.log(
        `  📊 Inserted ${totalInserted}/${transactions.length} transactions...`
      );
    }
  }

  // Update user total spent
  const totalCost = transactions.reduce((sum, tx) => sum + tx.cost, 0);
  await prisma.user.update({
    where: { id: userId },
    data: {
      totalSpent: {
        increment: totalCost,
      },
    },
  });

  // Update app membership total spent
  await prisma.appMembership.update({
    where: {
      userId_echoAppId: {
        userId,
        echoAppId: appId,
      },
    },
    data: {
      totalSpent: {
        increment: totalCost,
      },
    },
  });

  if (verbose) {
    console.log(`✅ Seeded ${totalInserted} transactions for app ${app.name}`);
    console.log(`💰 Total cost: $${totalCost.toFixed(4)}`);
  }

  return totalInserted;
}

/**
 * Seed usage data for all apps
 */
async function seedAllApps(options: SeedOptions): Promise<void> {
  const { verbose = false } = options;

  if (verbose) {
    console.log('🔍 Finding all active apps...');
  }

  const apps = await prisma.echoApp.findMany({
    where: {
      isActive: true,
      isArchived: false,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (apps.length === 0) {
    console.log('⚠️  No active apps found to seed');
    return;
  }

  if (verbose) {
    console.log(`📱 Found ${apps.length} active apps to seed`);
  }

  let totalTransactions = 0;
  for (let i = 0; i < apps.length; i++) {
    const app = apps[i];
    if (verbose) {
      console.log(`\n[${i + 1}/${apps.length}] Processing app: ${app.name}`);
    }

    const count = await seedAppUsage(app.id, options);
    totalTransactions += count;
  }

  console.log(
    `\n🎉 Successfully seeded ${totalTransactions} total transactions across ${apps.length} apps`
  );
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const appId = args[0];

  // Parse options
  const options: SeedOptions = {
    days: 30,
    transactionsPerDay: 50,
    verbose: true,
  };

  // Override options from command line
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--days' && args[i + 1]) {
      options.days = parseInt(args[i + 1]);
      i++;
    } else if (arg === '--transactions-per-day' && args[i + 1]) {
      options.transactionsPerDay = parseInt(args[i + 1]);
      i++;
    } else if (arg === '--quiet') {
      options.verbose = false;
    }
  }

  console.log('🚀 Starting app usage seeding...');
  console.log(`📊 Configuration:`);
  console.log(`   Days back: ${options.days}`);
  console.log(`   Transactions per day: ${options.transactionsPerDay}`);
  console.log();

  try {
    if (appId) {
      const count = await seedAppUsage(appId, options);
      console.log(
        `\n🎉 Successfully seeded ${count} transactions for app ${appId}`
      );
    } else {
      await seedAllApps(options);
    }
  } catch (error) {
    console.error('❌ Error seeding usage data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Show usage information
function showUsage(): void {
  console.log(`
Usage: tsx scripts/seed-app-usage.ts [app_id] [options]

Arguments:
  app_id                    Specific app ID to seed (optional, seeds all apps if not provided)

Options:
  --days <number>           Number of days back to generate data (default: 30)
  --transactions-per-day <number>  Average transactions per day (default: 50)
  --quiet                   Suppress verbose output

Examples:
  tsx scripts/seed-app-usage.ts                                    # Seed all apps
  tsx scripts/seed-app-usage.ts 12345-app-id                      # Seed specific app
  tsx scripts/seed-app-usage.ts --days 7 --transactions-per-day 100  # Custom options
  tsx scripts/seed-app-usage.ts 12345-app-id --days 14            # Specific app, 14 days
`);
}

// Handle help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showUsage();
  process.exit(0);
}

// Auto-run when called directly
if (typeof require !== 'undefined' && require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export { seedAppUsage, seedAllApps };
