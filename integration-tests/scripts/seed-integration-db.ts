import { PrismaClient } from '../../echo-control/src/generated/prisma/index.js';
import { loadIntegrationTestEnv } from './load-test-env.js';

export async function seedIntegrationDatabase() {
  // Load environment variables
  loadIntegrationTestEnv();

  // Force use of integration test database URL
  const databaseUrl =
    'postgresql://test:test@localhost:5433/echo_integration_test';
  console.log('🔗 Using integration test database URL:', databaseUrl);

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
  console.log('🌱 Seeding integration test database...');

  try {
    // Clean existing data in reverse dependency order
    await prisma.refreshToken.deleteMany();
    await prisma.llmTransaction.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.apiKey.deleteMany();
    await prisma.echoApp.deleteMany();
    await prisma.user.deleteMany();

    console.log('🧹 Cleaned existing data');

    // Create test users
    const testUser = await prisma.user.create({
      data: {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'test@example.com',
        name: 'Integration Test User',
        clerkId: 'user_2mP4JRQPpWlDVDPuyrxBxwZU6cM',
      },
    });

    console.log('👤 Created test user:', testUser.email);

    // Create test Echo apps (OAuth clients)
    const testApp = await prisma.echoApp.create({
      data: {
        id: '87654321-4321-4321-4321-fedcba987654',
        name: 'Integration Test Client',
        description: 'OAuth client for integration testing',
        authorizedCallbackUrls: [
          'http://localhost:3000/callback',
          'http://localhost:3001/callback',
          'http://localhost:3001/oauth/callback',
        ],
        userId: testUser.id,
        isActive: true,
      },
    });

    console.log('📱 Created test Echo app:', testApp.name);

    // Create test API keys
    const testApiKey = await prisma.apiKey.create({
      data: {
        id: '22222222-2222-2222-2222-222222222222',
        key: 'ek_test_1234567890abcdef',
        name: 'Integration Test API Key',
        userId: testUser.id,
        echoAppId: testApp.id,
        isActive: true,
      },
    });

    console.log('🔑 Created test API key:', testApiKey.name);

    // Create a second user for multi-user testing
    const secondUser = await prisma.user.create({
      data: {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'test2@example.com',
        name: 'Second Test User',
        clerkId: 'user_clerk_test_456',
      },
    });

    console.log('👤 Created second test user:', secondUser.email);

    // Create a second test app for the second user
    const secondApp = await prisma.echoApp.create({
      data: {
        id: '44444444-4444-4444-4444-444444444444',
        name: 'Second Integration Test Client',
        description: 'Second OAuth client for cross-client testing',
        authorizedCallbackUrls: [
          'http://localhost:3000/callback',
          'http://localhost:3002/callback',
        ],
        userId: secondUser.id,
        isActive: true,
      },
    });

    console.log('📱 Created second test Echo app:', secondApp.name);

    // Create some test payments
    await prisma.payment.create({
      data: {
        id: '55555555-5555-5555-5555-555555555555',
        stripePaymentId: 'pi_test_1234567890',
        amount: 1000, // $10.00
        currency: 'usd',
        status: 'succeeded',
        description: 'Test payment for integration testing',
        userId: testUser.id,
        echoAppId: testApp.id,
      },
    });

    console.log('💳 Created test payment');

    // Create some test LLM transactions
    await prisma.llmTransaction.create({
      data: {
        id: '66666666-6666-6666-6666-666666666666',
        model: 'claude-3-5-sonnet-20241022',
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        cost: 0.15,
        prompt: 'Test prompt for integration testing',
        response: 'Test response from integration testing',
        status: 'completed',
        userId: testUser.id,
        echoAppId: testApp.id,
      },
    });

    console.log('🤖 Created test LLM transaction');

    console.log('✅ Integration test database seeded successfully');
    console.log('\n📊 Summary:');
    console.log(`  - Users: 2`);
    console.log(`  - Echo Apps: 2`);
    console.log(`  - API Keys: 1`);
    console.log(`  - Payments: 1`);
    console.log(`  - LLM Transactions: 1`);
  } catch (error) {
    console.error('❌ Error seeding integration test database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Export test data constants for use in tests
export const TEST_DATA = {
  users: {
    testUser: {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'test@example.com',
      clerkId: 'user_2mP4JRQPpWlDVDPuyrxBxwZU6cM',
    },
    secondUser: {
      id: '33333333-3333-3333-3333-333333333333',
      email: 'test2@example.com',
      clerkId: 'user_clerk_test_456',
    },
  },
  echoApps: {
    testApp: {
      id: '87654321-4321-4321-4321-fedcba987654',
      name: 'Integration Test Client',
    },
    secondApp: {
      id: '44444444-4444-4444-4444-444444444444',
      name: 'Second Integration Test Client',
    },
  },
  apiKeys: {
    testKey: {
      id: '22222222-2222-2222-2222-222222222222',
      key: 'ek_test_1234567890abcdef',
    },
  },
};

// Auto-run when called directly
if (typeof require !== 'undefined' && require.main === module) {
  seedIntegrationDatabase()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
