import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';

import type { OAuthProvider } from './types';
import { Provider } from 'next-auth/providers';
import { db } from '@/lib/db';

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

export const testProviders: Provider[] = [
  Credentials({
    id: 'test',
    name: 'Test',
    credentials: {},
    authorize: async () => {
      const existingUser = await db.user.findUnique({
        where: {
          email: 'test@merit.systems',
        },
      });

      if (existingUser) {
        return {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          image: existingUser.image,
        };
      }

      const user = await db.user.create({
        data: {
          name: 'Test User',
          email: 'test@merit.systems',
          image: 'http://echo.merit.systems/logo/light.svg',
        },
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      };
    },
  }),
];
