import Echo from '@merit-systems/echo-next-sdk';

const baseEchoUrl = process.env.NEXT_PUBLIC_ECHO_URL || 'https://echo.merit.systems';
const baseRouterUrl = process.env.NEXT_PUBLIC_ROUTER_URL || 'https://echo.router.merit.systems';
const appId = process.env.NEXT_PUBLIC_ECHO_APP_ID || '60601628-cdb7-481e-8f7e-921981220348';

export const { handlers, isSignedIn, openai, anthropic, getUser } = Echo({
  appId,
  baseEchoUrl,
  baseRouterUrl,
});
