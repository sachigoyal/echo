import { EchoApp, User } from '@/generated/prisma';
import { getCurrentUser } from '@/lib/auth';
import { db } from '../db';
/**
 * Check if the current user is an admin
 * @returns true if the user is an admin, false otherwise
 */
export async function isGlobalAdmin(): Promise<boolean> {
  const user = await getCurrentUser();

  return user.admin;
}

export async function getUsers(): Promise<User[]> {
  const isAdmin = await isGlobalAdmin();

  if (!isAdmin) {
    throw new Error('Admin access required');
  }

  return await db.user.findMany();
}

export async function getAppsForUser(userId: string): Promise<EchoApp[]> {
  const isAdmin = await isGlobalAdmin();

  if (!isAdmin) {
    throw new Error('Admin access required');
  }

  return await db.echoApp.findMany({
    where: {
      appMemberships: {
        some: {
          userId: userId,
          role: 'owner',
        },
      },
    },
  });
}
