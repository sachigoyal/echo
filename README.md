To dev:

pnpm install,
Add integration-tests/env.test, add echo-server/.env, add echo-control/.env,
cd echo-control && pnpm run prisma:generate,

4.cd integration-tests && pnpm run env:setup
pnpm run test

# Echo React SDK Setup

Check out the [Echo SDK Documentation](ECHO_SDK_DOCUMENTATION.md)


