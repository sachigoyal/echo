import { db } from '@/lib/db';
import { AppRole, MembershipStatus, Permission, UserAppAccess } from './types';
import { EchoApp, AppMembership } from '@/generated/prisma';

export class PermissionService {
  private static rolePermissions: Record<AppRole, Permission[]> = {
    [AppRole.OWNER]: [
      Permission.READ_APP,
      Permission.EDIT_APP,
      Permission.DELETE_APP,
      Permission.MANAGE_CUSTOMERS,
      Permission.INVITE_CUSTOMERS,
      Permission.CREATE_API_KEYS,
      Permission.MANAGE_ALL_API_KEYS,
      Permission.MANAGE_BILLING,
      Permission.VIEW_ANALYTICS,
      Permission.USE_LLM_API,
    ],
    [AppRole.ADMIN]: [
      Permission.READ_APP,
      Permission.EDIT_APP,
      Permission.INVITE_CUSTOMERS,
      Permission.CREATE_API_KEYS,
      Permission.MANAGE_ALL_API_KEYS,
      Permission.VIEW_ANALYTICS,
      Permission.USE_LLM_API,
    ],
    [AppRole.CUSTOMER]: [
      Permission.READ_APP,
      Permission.MANAGE_OWN_API_KEYS,
      Permission.VIEW_OWN_USAGE,
      Permission.USE_LLM_API,
    ],
  };

  static async getUserAppRole(
    userId: string,
    appId: string
  ): Promise<AppRole | null> {
    // First check if user is the owner (backward compatibility)
    const app = await db.echoApp.findFirst({
      where: { id: appId, userId, isArchived: false },
    });

    if (app) {
      return AppRole.OWNER;
    }

    // Check app membership
    const membership = await db.appMembership.findFirst({
      where: {
        userId,
        echoAppId: appId,
        status: MembershipStatus.ACTIVE,
        isArchived: false,
      },
    });

    return membership ? (membership.role as AppRole) : null;
  }

  static async hasPermission(
    userId: string,
    appId: string,
    permission: Permission
  ): Promise<boolean> {
    const role = await this.getUserAppRole(userId, appId);
    if (!role) return false;

    const rolePermissions = this.rolePermissions[role];
    return rolePermissions.includes(permission);
  }

  static async getUserAppAccess(
    userId: string,
    appId: string
  ): Promise<UserAppAccess | null> {
    const role = await this.getUserAppRole(userId, appId);
    if (!role) return null;

    return {
      userId,
      appId,
      role,
      status: MembershipStatus.ACTIVE,
      permissions: this.rolePermissions[role],
    };
  }

  static async getAccessibleApps(
    userId: string,
    role?: AppRole
  ): Promise<Array<{ app: EchoApp; userRole: AppRole }>> {
    const results: Array<{ app: EchoApp; userRole: AppRole }> = [];

    // Get owned apps (backward compatibility)
    const ownedApps = await db.echoApp.findMany({
      where: { userId, isArchived: false },
    });

    results.push(...ownedApps.map(app => ({ app, userRole: AppRole.OWNER })));

    // Get membership apps
    const memberships = await db.appMembership.findMany({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
        isArchived: false,
        ...(role && { role }),
      },
      include: { echoApp: true },
    });

    results.push(
      ...memberships.map((m: AppMembership & { echoApp: EchoApp }) => ({
        app: m.echoApp,
        userRole: m.role as AppRole,
      }))
    );

    return results;
  }
}
