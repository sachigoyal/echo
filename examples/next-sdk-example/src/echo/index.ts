import Echo from '@merit-systems/echo-next-sdk';

const baseEchoUrl =
  process.env.NEXT_PUBLIC_ECHO_URL || 'https://echo.merit.systems';
const baseRouterUrl =
  process.env.NEXT_PUBLIC_ROUTER_URL || 'https://echo.router.merit.systems';
const appId =
  process.env.NEXT_PUBLIC_ECHO_APP_ID || '74d9c979-e036-4e43-904f-32d214b361fc';

export const { handlers, isSignedIn, openai, anthropic, getUser } = Echo({
  appId,
  baseEchoUrl,
  baseRouterUrl,
});
