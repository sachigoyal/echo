import Echo from '@merit-systems/echo-next-sdk';

const baseEchoUrl = process.env.NEXT_PUBLIC_ECHO_URL || 'http://localhost:3000';
const baseRouterUrl =
  process.env.NEXT_PUBLIC_ROUTER_URL || 'http://localhost:3070';
const appId =
  process.env.NEXT_PUBLIC_ECHO_APP_ID || '4bc54846-9b96-4c78-b132-117903afc974';

export const { handlers, isSignedIn, openai, anthropic, google, getUser } =
  Echo({
    appId,
    baseEchoUrl,
    baseRouterUrl,
  });
