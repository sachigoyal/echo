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
    await prisma.transaction.deleteMany();
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
      },
    });

    // Create app membership for the test user as owner
    await prisma.appMembership.create({
      data: {
        userId: testUser.id,
        echoAppId: testApp.id,
        role: 'owner',
        status: 'active',
        totalSpent: 0,
      },
    });

    console.log('📱 Created test Echo app:', testApp.name);

    // Create test API keys
    const testApiKey = await prisma.apiKey.create({
      data: {
        ...TEST_DATA.apiKeys.primary,
        userId: testUser.id,
        echoAppId: testApp.id,
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
      },
    });

    // Create app membership for the second user as owner
    await prisma.appMembership.create({
      data: {
        userId: secondUser.id,
        echoAppId: secondApp.id,
        role: 'owner',
        status: 'active',
        totalSpent: 0,
      },
    });

    console.log('📱 Created second test Echo app:', secondApp.name);

    // Create some test payments
    await prisma.payment.create({
      data: {
        ...TEST_DATA.payments.testPayment,
        userId: testUser.id,
      },
    });

    await prisma.user.update({
      where: { id: testUser.id },
      data: {
        totalPaid: TEST_DATA.payments.testPayment.amount,
      },
    });

    console.log('💳 Created test payment');

    // Create some test LLM transactions
    await prisma.transaction.create({
      data: {
        ...TEST_DATA.llmTransactions.testTransaction,
        userId: testUser.id,
        echoAppId: testApp.id,
        apiKeyId: testApiKey.id,
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
