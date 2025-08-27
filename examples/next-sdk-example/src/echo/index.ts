import Echo from '@merit-systems/echo-next-sdk';

export const { handlers, isSignedIn, openai, anthropic, getUser } = Echo({
  appId: '60601628-cdb7-481e-8f7e-921981220348',
  // baseEchoUrl: 'http://localhost:3001',
  // baseRouterUrl: 'http://localhost:3070',
});
