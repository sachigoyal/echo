import { PermissionService } from '@/lib/permissions';
import { AppRole } from '@/lib/permissions/types';
import { getOwnerEchoApp } from './owner';
import { getCustomerEchoApp } from './customer';
import { getPublicEchoApp } from './public';
import { OwnerEchoApp, CustomerEchoApp, PublicEchoApp } from './types';

/**
 * Get an app with the appropriate level of detail based on user permissions.
 * Checks the user's role on the app and returns the correct data structure:
 * - Owner: Full app details with owner statistics and management data
 * - Customer: App details with customer statistics
 * - Public: Basic app details with global statistics only
 *
 * @param appId - The ID of the app to fetch
 * @param userId - The ID of the user requesting the app (optional for public access)
 * @returns The app data appropriate for the user's permission level
 */
export async function getApp(
  appId: string,
  userId?: string
): Promise<OwnerEchoApp | CustomerEchoApp | PublicEchoApp> {
  // If no userId provided, return public view
  if (!userId) {
    return getPublicEchoApp(appId);
  }

  // Get the user's role for this app
  const role = await PermissionService.getUserAppRole(userId, appId);

  // Return the appropriate app data based on role
  switch (role) {
    case AppRole.OWNER:
      return getOwnerEchoApp(appId, userId);

    case AppRole.ADMIN:
    case AppRole.CUSTOMER:
      // Both admin and customer get the customer view
      // (admin role might be expanded in the future)
      return getCustomerEchoApp(appId, userId);

    case AppRole.PUBLIC:
    default:
      return getPublicEchoApp(appId);
  }
}

/**
 * Get an app with permission check, throwing an error if the user doesn't have access.
 * This is useful when you want to ensure the user has at least read access to the app.
 *
 * @param appId - The ID of the app to fetch
 * @param userId - The ID of the user requesting the app
 * @param minimumRole - The minimum role required (defaults to PUBLIC for read access)
 * @returns The app data appropriate for the user's permission level
 * @throws Error if the user doesn't have the required permission level
 */
export async function getAppWithPermissionCheck(
  appId: string,
  userId: string,
  minimumRole: AppRole = AppRole.PUBLIC
): Promise<OwnerEchoApp | CustomerEchoApp | PublicEchoApp> {
  const role = await PermissionService.getUserAppRole(userId, appId);

  // Check if user has sufficient permissions
  const roleHierarchy = {
    [AppRole.OWNER]: 3,
    [AppRole.ADMIN]: 2,
    [AppRole.CUSTOMER]: 1,
    [AppRole.PUBLIC]: 0,
  };

  if (roleHierarchy[role] < roleHierarchy[minimumRole]) {
    throw new Error(
      `Insufficient permissions. Required role: ${minimumRole}, user role: ${role}`
    );
  }

  // Return the appropriate app data based on actual role
  return getApp(appId, userId);
}

/**
 * Type guard to check if the returned app is an OwnerEchoApp
 */
export function isOwnerApp(
  app: OwnerEchoApp | CustomerEchoApp | PublicEchoApp
): app is OwnerEchoApp {
  return 'type' in app && app.type === 'owner';
}

/**
 * Type guard to check if the returned app is a CustomerEchoApp
 */
export function isCustomerApp(
  app: OwnerEchoApp | CustomerEchoApp | PublicEchoApp
): app is CustomerEchoApp {
  return 'type' in app && app.type === 'customer';
}

/**
 * Type guard to check if the returned app is a PublicEchoApp
 */
export function isPublicApp(
  app: OwnerEchoApp | CustomerEchoApp | PublicEchoApp
): app is PublicEchoApp {
  return 'type' in app && app.type === 'public';
}
