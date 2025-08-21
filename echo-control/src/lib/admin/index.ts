import { getCurrentUser } from '@/lib/auth';
/**
 * Check if the current user is an admin
 * @returns true if the user is an admin, false otherwise
 */
export async function isGlobalAdmin(): Promise<boolean> {
  const user = await getCurrentUser();

  return user.admin;
}
