/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable experimental features if needed
  },
  // Ensure proper handling of external packages
  transpilePackages: ['@zdql/echo-react-sdk'],

  // Configure environment variables
  env: {
    ECHO_API_URL: process.env.ECHO_API_URL || 'http://localhost:3000',
    ECHO_APP_ID:
      process.env.ECHO_APP_ID || '39054694-0960-4612-9741-05fd6175f4f9',
  },
};

module.exports = nextConfig;
