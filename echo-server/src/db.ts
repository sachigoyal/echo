import { PrismaClient } from './generated/prisma';

declare global {
  // eslint-disable-next-line no-var
  var __echoPrisma__: PrismaClient | undefined;
}

export function getPrismaClient(): PrismaClient {
  if (!global.__echoPrisma__) {
    global.__echoPrisma__ = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL ?? 'postgresql://localhost:5469/echo',
        },
      },
    });
  }
  return global.__echoPrisma__;
}
