import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';

import { providers } from './providers';

import { db } from '@/lib/db';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  adapter: PrismaAdapter(db),
});
