import { providers, testProviders } from './providers';

// Example of importing from local package
import EchoProvider from '../../../echo-authjs-provider/src/index';

import type { DefaultSession, NextAuthConfig } from 'next-auth';
import type { DefaultJWT } from 'next-auth/jwt';
import { skipCSRFCheck } from '@auth/core';

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
  }
}

const IS_TEST_MODE = process.env.TEST_MODE === 'true';

export const authConfig = {
  providers: IS_TEST_MODE ? testProviders : providers,
  skipCSRFCheck: IS_TEST_MODE ? skipCSRFCheck : undefined,
  debug: true,
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id as string;
      }

      return token;
    },
    session: ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
        },
      };
    },
    authorized: async ({ auth }) => {
      return !!auth;
    },
  },
} satisfies NextAuthConfig;
