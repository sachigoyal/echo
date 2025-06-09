const jwt = require('jsonwebtoken');

const TEST_JWT_SECRET =
  'cc7e0d44fd473002f1c42167459001140ec6389b7353f8088f4d9a95f2f596f2';

async function createExpiredJWT(overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  const basePayload = {
    userId: 'test-user-123',
    appId: 'test-app-456',
    scope: 'llm:invoke',
    aud: 'echo-proxy',
    iss: 'http://localhost:3000',
    ...overrides,
  };

  // Ensure we have expired timestamps that won't be overridden
  const payload = {
    ...basePayload,
    iat: overrides.iat ?? now - 3600, // 1 hour ago
    exp: overrides.exp ?? now - 1800, // 30 minutes ago (expired)
  };

  console.log('Payload before signing:', payload);

  const token = jwt.sign(payload, TEST_JWT_SECRET, {
    algorithm: 'HS256',
    noTimestamp: true, // We're setting iat manually
  });

  console.log('Token created:', token);
  const decoded = jwt.decode(token);
  console.log('Decoded token:', decoded);

  return token;
}

createExpiredJWT()
  .then(() => console.log('Done'))
  .catch(console.error);
