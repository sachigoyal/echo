import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';

import type { OAuthProvider } from './types';

export const providers: OAuthProvider[] = [
  GoogleProvider({
    clientId: process.env.AUTH_GOOGLE_ID,
    clientSecret: process.env.AUTH_GOOGLE_SECRET,
    allowDangerousEmailAccountLinking: true,
  }),
  GithubProvider({
    clientId: process.env.AUTH_GITHUB_ID,
    clientSecret: process.env.AUTH_GITHUB_SECRET,
    allowDangerousEmailAccountLinking: true,
  }),
];
