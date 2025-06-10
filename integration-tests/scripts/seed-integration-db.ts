import { PrismaClient } from '../../echo-control/src/generated/prisma/index.js';
import { TEST_CONFIG, TEST_DATA } from '../config/index.js';

export async function seedIntegrationDatabase() {
  console.log(
    '🔗 Using integration test database URL:',
    TEST_CONFIG.database.url
  );

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: TEST_CONFIG.database.url,
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
      data: TEST_DATA.users.primary,
    });

    console.log('👤 Created test user:', testUser.email);

    // Create test Echo apps (OAuth clients)
    const testApp = await prisma.echoApp.create({
      data: {
        ...TEST_DATA.echoApps.primary,
        authorizedCallbackUrls: TEST_DATA.oauth.defaultCallbackUrls,
        userId: testUser.id,
        isActive: true,
      },
    });

    console.log('📱 Created test Echo app:', testApp.name);

    // Create test API keys
    const testApiKey = await prisma.apiKey.create({
      data: {
        ...TEST_DATA.apiKeys.primary,
        userId: testUser.id,
        echoAppId: testApp.id,
        isActive: true,
      },
    });

    console.log('🔑 Created test API key:', testApiKey.name);

    // Create a second user for multi-user testing
    const secondUser = await prisma.user.create({
      data: TEST_DATA.users.secondary,
    });

    console.log('👤 Created second test user:', secondUser.email);

    // Create a second test app for the second user
    const secondApp = await prisma.echoApp.create({
      data: {
        ...TEST_DATA.echoApps.secondary,
        authorizedCallbackUrls: TEST_DATA.oauth.secondaryCallbackUrls,
        userId: secondUser.id,
        isActive: true,
      },
    });

    console.log('📱 Created second test Echo app:', secondApp.name);

    // Create some test payments
    await prisma.payment.create({
      data: {
        ...TEST_DATA.payments.testPayment,
        userId: testUser.id,
        echoAppId: testApp.id,
      },
    });

    console.log('💳 Created test payment');

    // Create some test LLM transactions
    await prisma.llmTransaction.create({
      data: {
        ...TEST_DATA.llmTransactions.testTransaction,
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

// Re-export test data for backward compatibility
export { TEST_DATA } from '../config/index.js';

// Auto-run when called directly
if (typeof require !== 'undefined' && require.main === module) {
  seedIntegrationDatabase()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
