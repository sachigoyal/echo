import { EchoApp, Prisma } from '@/generated/prisma';
import { db } from '../db';
import { AppRole, MembershipStatus } from '../permissions/types';
import { PermissionService } from '../permissions/service';
import { Permission } from '../permissions/types';
import { softDeleteEchoApp } from '../soft-delete';
import {
  getAppActivity,
  transformActivityToChartData,
} from './activity/activity';
import { isValidUrl } from '../stripe/payment-link';
import { DetailedEchoApp, PublicEchoApp } from '../types/apps';

// Types for better type safety
export interface AppCreateInput {
  name: string;
  description?: string;
  githubType?: 'user' | 'repo';
  githubId?: string;
  authorizedCallbackUrls?: string[];
  isPublic?: boolean;
}

export interface AppUpdateInput {
  name?: string;
  description?: string;
  isActive?: boolean;
  isPublic?: boolean;
  githubType?: 'user' | 'repo';
  githubId?: string;
  profilePictureUrl?: string;
  bannerImageUrl?: string;
  homepageUrl?: string;
  authorizedCallbackUrls?: string[];
}

// Legacy type for backward compatibility with existing list views
export interface AppWithDetails {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isPublic: boolean;
  profilePictureUrl?: string | null;
  bannerImageUrl?: string | null;
  homepageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  authorizedCallbackUrls: string[];
  userRole: AppRole;
  totalTokens: number;
  totalCost: number;
  _count: {
    apiKeys: number;
    llmTransactions: number;
  };
  owner: {
    id: string;
    email: string;
    name: string | null;
    profilePictureUrl?: string | null;
  };
  activityData: number[];
}

// Validation functions
export const validateAppName = (name: string): string | null => {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return 'App name is required';
  }
  if (name.length > 100) {
    return 'App name must be 100 characters or less';
  }
  return null;
};

export const validateAppDescription = (description?: string): string | null => {
  if (description && typeof description !== 'string') {
    return 'Description must be a string';
  }
  if (description && description.length > 500) {
    return 'Description must be 500 characters or less';
  }
  return null;
};

export const validateGithubId = (githubId?: string): string | null => {
  if (githubId && typeof githubId !== 'string') {
    return 'GitHub ID must be a string';
  }
  if (githubId && githubId.trim().length === 0) {
    return 'GitHub ID cannot be empty if provided';
  }
  if (githubId && githubId.length > 200) {
    return 'GitHub ID must be 200 characters or less';
  }
  return null;
};

export const validateGithubType = (githubType?: string): string | null => {
  if (githubType && !['user', 'repo'].includes(githubType)) {
    return 'GitHub Type must be either "user" or "repo"';
  }
  return null;
};

export const validateHomepageUrl = (homepageUrl?: string): string | null => {
  if (homepageUrl && typeof homepageUrl !== 'string') {
    return 'Homepage URL must be a string';
  }
  if (homepageUrl && homepageUrl.trim().length === 0) {
    return 'Homepage URL cannot be empty if provided';
  }
  if (homepageUrl && homepageUrl.length > 500) {
    return 'Homepage URL must be 500 characters or less';
  }
  if (homepageUrl) {
    try {
      const url = new URL(homepageUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return 'Homepage URL must start with http:// or https://';
      }
    } catch {
      return 'Homepage URL must be a valid URL';
    }
  }
  return null;
};

export const verifyArgs = (data: {
  name?: string;
  description?: string;
  githubType?: string;
  githubId?: string;
  authorizedCallbackUrls?: string[];
  profilePictureUrl?: string;
  bannerImageUrl?: string;
  homepageUrl?: string;
  isActive?: boolean;
  isPublic?: boolean;
}): string | null => {
  // Validate name
  if (data.name !== undefined) {
    const nameError = validateAppName(data.name);
    if (nameError) return nameError;
  }

  // Validate description
  if (data.description !== undefined) {
    const descriptionError = validateAppDescription(data.description);
    if (descriptionError) return descriptionError;
  }

  // Validate githubType
  if (data.githubType !== undefined) {
    const githubTypeError = validateGithubType(data.githubType);
    if (githubTypeError) return githubTypeError;
  }

  // Validate githubId
  if (data.githubId !== undefined) {
    const githubIdError = validateGithubId(data.githubId);
    if (githubIdError) return githubIdError;
  }

  // Validate authorizedCallbackUrls
  if (data.authorizedCallbackUrls !== undefined) {
    if (!Array.isArray(data.authorizedCallbackUrls)) {
      return 'Authorized callback URLs must be an array';
    }

    for (const url of data.authorizedCallbackUrls) {
      if (typeof url !== 'string') {
        return 'All callback URLs must be strings';
      }

      if (url.trim().length === 0) {
        return 'Callback URLs cannot be empty';
      }

      // Allow localhost URLs for development
      const isLocalhostUrl = url.startsWith('http://localhost:');
      if (!isLocalhostUrl && !isValidUrl(url)) {
        return `Invalid callback URL: ${url}`;
      }
    }
  }

  // Validate profilePictureUrl
  if (data.profilePictureUrl !== undefined && data.profilePictureUrl !== null) {
    if (typeof data.profilePictureUrl !== 'string') {
      return 'Profile picture URL must be a string';
    }

    if (data.profilePictureUrl.trim().length === 0) {
      return 'Profile picture URL cannot be empty if provided';
    }

    if (!isValidUrl(data.profilePictureUrl)) {
      return 'Profile picture URL must be a valid URL';
    }
  }

  // Validate bannerImageUrl
  if (data.bannerImageUrl !== undefined && data.bannerImageUrl !== null) {
    if (typeof data.bannerImageUrl !== 'string') {
      return 'Banner image URL must be a string';
    }

    if (data.bannerImageUrl.trim().length === 0) {
      return 'Banner image URL cannot be empty if provided';
    }

    if (!isValidUrl(data.bannerImageUrl)) {
      return 'Banner image URL must be a valid URL';
    }
  }

  // Validate homepageUrl
  if (data.homepageUrl !== undefined) {
    const homepageUrlError = validateHomepageUrl(data.homepageUrl);
    if (homepageUrlError) return homepageUrlError;
  }

  // Validate isActive
  if (data.isActive !== undefined) {
    if (typeof data.isActive !== 'boolean') {
      return 'isActive must be a boolean';
    }
  }

  // Validate isPublic
  if (data.isPublic !== undefined) {
    if (typeof data.isPublic !== 'boolean') {
      return 'isPublic must be a boolean';
    }
  }

  return null; // No validation errors
};

// Business logic functions
export const listAppsWithDetails = async (
  userId: string,
  role?: AppRole
): Promise<AppWithDetails[]> => {
  // Get user's accessible apps with memberships in a single query
  const userMemberships = await db.appMembership.findMany({
    where: {
      userId,
      status: MembershipStatus.ACTIVE,
      isArchived: false,
      ...(role && { role }),
    },
    include: {
      echoApp: {
        include: {
          // Include the owner membership and their user details
          appMemberships: {
            where: {
              role: AppRole.OWNER,
              isArchived: false,
            },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  profilePictureUrl: true,
                },
              },
              echoApp: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  profilePictureUrl: true,
                  bannerImageUrl: true,
                },
              },
            },
            take: 1, // There should only be one owner
          },
          _count: {
            select: {
              apiKeys: {
                where: { isActive: true, isArchived: false },
              },
              llmTransactions: {
                where: { isArchived: false },
              },
            },
          },
        },
      },
    },
  });

  // Get transaction totals for all apps in batch
  const appIds = userMemberships.map(m => m.echoApp.id);
  const transactionStats = await db.llmTransaction.groupBy({
    by: ['echoAppId'],
    where: {
      echoAppId: { in: appIds },
      isArchived: false,
    },
    _sum: {
      totalTokens: true,
      cost: true,
    },
  });

  // Create a map for quick lookup of transaction stats
  const statsMap = new Map(
    transactionStats.map(stat => [
      stat.echoAppId,
      {
        totalTokens: stat._sum.totalTokens || 0,
        totalCost: Number(stat._sum.cost || 0),
      },
    ])
  );

  // Get activity data for all apps in batch
  const activityDataMap = new Map<string, number[]>();
  await Promise.all(
    appIds.map(async appId => {
      try {
        const activity = await getAppActivity(appId);
        const activityData = transformActivityToChartData(activity);
        activityDataMap.set(appId, activityData);
      } catch (error) {
        console.error(`Failed to fetch activity for app ${appId}:`, error);
        // Fallback to empty array if activity fetch fails
        activityDataMap.set(appId, []);
      }
    })
  );

  // Transform the results
  return userMemberships.map(membership => {
    const app = membership.echoApp;
    const owner = app.appMemberships[0]?.user || null;
    const stats = statsMap.get(app.id) || { totalTokens: 0, totalCost: 0 };
    const activityData = activityDataMap.get(app.id) || [];

    return {
      id: app.id,
      name: app.name,
      description: app.description,
      profilePictureUrl: app.profilePictureUrl,
      bannerImageUrl: app.bannerImageUrl,
      isActive: app.isActive,
      isPublic: app.isPublic || false,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      authorizedCallbackUrls: app.authorizedCallbackUrls,
      userRole: membership.role as AppRole,
      totalTokens: stats.totalTokens,
      totalCost: stats.totalCost,
      _count: {
        apiKeys: app._count.apiKeys,
        llmTransactions: app._count.llmTransactions,
      },
      owner: owner,
      activityData,
    };
  });
};

export const getPublicAppInfo = async (
  appId: string
): Promise<PublicEchoApp> => {
  // Step 1: Find the app
  let app;
  try {
    app = await db.echoApp.findFirst({
      where: {
        id: appId,
        isArchived: false,
        // Public apps should be accessible to everyone
        isPublic: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        profilePictureUrl: true,
        bannerImageUrl: true,
        homepageUrl: true,
        githubId: true,
        githubType: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch (appQueryError) {
    console.error(
      'getPublicAppInfo STEP 1 FAILED - Database error while fetching public app:',
      {
        appId,
        operation: 'db.echoApp.findFirst (public app lookup)',
        error:
          appQueryError instanceof Error
            ? appQueryError.message
            : 'Unknown error',
        errorStack:
          appQueryError instanceof Error ? appQueryError.stack : undefined,
        isDatabaseError: true,
        prismaError:
          appQueryError instanceof Error &&
          appQueryError.message.includes('Prisma'),
      }
    );
    throw new Error(
      `Database error while fetching public app: ${appQueryError instanceof Error ? appQueryError.message : 'Unknown error'}`
    );
  }

  if (!app) {
    console.error(
      'getPublicAppInfo STEP 1 FAILED - App not found or not publicly accessible:',
      {
        appId,
        operation: 'db.echoApp.findFirst result validation',
        reason:
          'Query returned null - app does not exist, is archived, or isPublic=false',
        expectedConditions:
          'App must exist, isArchived=false, and isPublic=true',
      }
    );
    throw new Error('Echo app not found or not publicly accessible');
  }

  // Step 2: Find the owner of the app (only name, not email for privacy)
  let ownerMembership;
  try {
    ownerMembership = await db.appMembership.findFirst({
      where: {
        echoAppId: appId,
        role: AppRole.OWNER,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  } catch (ownerQueryError) {
    console.error(
      'getPublicAppInfo STEP 2 FAILED - Database error while fetching app owner:',
      {
        appId,
        operation: 'db.appMembership.findFirst (owner lookup for public app)',
        error:
          ownerQueryError instanceof Error
            ? ownerQueryError.message
            : 'Unknown error',
        errorStack:
          ownerQueryError instanceof Error ? ownerQueryError.stack : undefined,
        isDatabaseError: true,
        prismaError:
          ownerQueryError instanceof Error &&
          ownerQueryError.message.includes('Prisma'),
      }
    );
    // For public apps, we can continue without owner info if needed
    ownerMembership = null;
  }

  // Step 3: Get full aggregated statistics for public view (always global)
  let stats;
  try {
    stats = await db.llmTransaction.aggregate({
      where: {
        echoAppId: appId,
        isArchived: false,
      },
      _count: true,
      _sum: {
        totalTokens: true,
        inputTokens: true,
        outputTokens: true,
        cost: true,
      },
    });
  } catch (statsError) {
    console.error(
      'getPublicAppInfo STEP 3 FAILED - Database error while fetching public app statistics:',
      {
        appId,
        operation: 'db.llmTransaction.aggregate (public stats)',
        error:
          statsError instanceof Error ? statsError.message : 'Unknown error',
        errorStack: statsError instanceof Error ? statsError.stack : undefined,
        isDatabaseError: true,
        prismaError:
          statsError instanceof Error && statsError.message.includes('Prisma'),
      }
    );
    // Provide default stats for public view
    stats = {
      _count: 0,
      _sum: {
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
      },
    };
  }

  // Step 4: Get model usage breakdown (always global for public view)
  let modelUsage: Array<{
    model: string;
    _count: number;
    _sum: { totalTokens: number | null; cost: number | null };
  }> = [];
  try {
    // @ts-expect-error - Prisma groupBy return type conflict with TypeScript strict mode
    modelUsage = await db.llmTransaction.groupBy({
      by: ['model'],
      where: {
        echoAppId: appId,
        isArchived: false,
      },
      _count: true,
      _sum: {
        totalTokens: true,
        cost: true,
      },
      orderBy: {
        _sum: {
          totalTokens: 'desc',
        },
      },
    });
  } catch (modelUsageError) {
    console.error(
      'getPublicAppInfo STEP 4 FAILED - Database error while fetching public app model usage:',
      {
        appId,
        operation: 'db.llmTransaction.groupBy (public model usage)',
        error:
          modelUsageError instanceof Error
            ? modelUsageError.message
            : 'Unknown error',
        errorStack:
          modelUsageError instanceof Error ? modelUsageError.stack : undefined,
        isDatabaseError: true,
        prismaError:
          modelUsageError instanceof Error &&
          modelUsageError.message.includes('Prisma'),
      }
    );
    modelUsage = [];
  }

  // Step 5: Get recent transactions (always global for public view)
  let recentTransactions: Array<{
    id: string;
    model: string;
    totalTokens: number;
    cost: number;
    status: string;
    createdAt: Date;
  }> = [];
  try {
    // @ts-expect-error - Prisma findMany return type inference issue
    recentTransactions = await db.llmTransaction.findMany({
      where: {
        echoAppId: appId,
        isArchived: false,
      },
      select: {
        id: true,
        model: true,
        totalTokens: true,
        cost: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  } catch (transactionsError) {
    console.error(
      'getPublicAppInfo STEP 5 FAILED - Database error while fetching public app recent transactions:',
      {
        appId,
        operation: 'db.llmTransaction.findMany (public recent transactions)',
        error:
          transactionsError instanceof Error
            ? transactionsError.message
            : 'Unknown error',
        errorStack:
          transactionsError instanceof Error
            ? transactionsError.stack
            : undefined,
        isDatabaseError: true,
        prismaError:
          transactionsError instanceof Error &&
          transactionsError.message.includes('Prisma'),
      }
    );
    recentTransactions = [];
  }

  // Step 6: Get activity data for the last 7 days
  let activityData: number[] = [];
  try {
    const activity = await getAppActivity(appId);
    activityData = transformActivityToChartData(activity);
  } catch (activityError) {
    console.error(
      'getPublicAppInfo STEP 6 FAILED - Error while fetching public app activity:',
      {
        appId,
        operation:
          'getAppActivity + transformActivityToChartData (public activity)',
        error:
          activityError instanceof Error
            ? activityError.message
            : 'Unknown error',
        errorStack:
          activityError instanceof Error ? activityError.stack : undefined,
        isDatabaseError:
          activityError instanceof Error &&
          (activityError.message.includes('Prisma') ||
            activityError.message.includes('database')),
      }
    );
    activityData = [];
  }

  const numberOfUsers = await db.appMembership.count({
    where: {
      echoAppId: appId,
    },
  });

  return {
    ...app,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
    githubType: app.githubType as 'user' | 'repo' | null,
    isPublic: true,
    userRole: AppRole.PUBLIC,
    permissions: [Permission.READ_APP],
    totalTokens: stats._sum.totalTokens || 0,
    totalCost: Number(stats._sum.cost || 0),
    authorizedCallbackUrls: [],
    _count: {
      apiKeys: 0,
      llmTransactions: stats._count || 0,
    },
    owner: ownerMembership?.user
      ? {
          id: ownerMembership.user.id,
          email: '', // Don't expose email for public apps
          name: ownerMembership.user.name,
          profilePictureUrl: null,
        }
      : {
          id: '',
          email: '',
          name: null,
          profilePictureUrl: null,
        },
    stats: {
      totalTransactions: stats._count || 0,
      totalTokens: stats._sum.totalTokens || 0,
      totalInputTokens: stats._sum.inputTokens || 0,
      totalOutputTokens: stats._sum.outputTokens || 0,
      totalCost: Number(stats._sum.cost || 0),
      modelUsage: modelUsage.map(usage => ({
        model: usage.model,
        _count: usage._count,
        _sum: {
          totalTokens: usage._sum.totalTokens || 0,
          cost: Number(usage._sum.cost || 0),
        },
      })),
      numberOfUsers: numberOfUsers,
    },
    recentTransactions: recentTransactions.map(transaction => ({
      ...transaction,
      cost: Number(transaction.cost),
      createdAt: transaction.createdAt.toISOString(),
    })),
    activityData,
  };
};

export const getPublicAppsInfo = async (
  page = 1,
  limit = 10
): Promise<{
  apps: PublicEchoApp[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}> => {
  try {
    const offset = (page - 1) * limit;

    // Step 1: Get paginated public apps with basic info
    const [publicApps, totalCount] = await Promise.all([
      db.echoApp.findMany({
        where: {
          isPublic: true,
          isActive: true,
          isArchived: false,
        },
        select: {
          id: true,
          name: true,
          description: true,
          profilePictureUrl: true,
          bannerImageUrl: true,
          homepageUrl: true,
          githubId: true,
          githubType: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      db.echoApp.count({
        where: {
          isPublic: true,
          isActive: true,
          isArchived: false,
        },
      }),
    ]);

    if (publicApps.length === 0) {
      return {
        apps: [],
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        hasNextPage: false,
        hasPreviousPage: page > 1,
      };
    }

    const appIds = publicApps.map(app => app.id);

    // Step 2: Batch fetch owner information
    const ownerMemberships = await db.appMembership.findMany({
      where: {
        echoAppId: { in: appIds },
        role: AppRole.OWNER,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Step 3: Batch fetch transaction stats for all apps
    const allStats = await Promise.all(
      appIds.map(async appId => {
        try {
          const stats = await db.llmTransaction.aggregate({
            where: {
              echoAppId: appId,
              isArchived: false,
            },
            _count: true,
            _sum: {
              totalTokens: true,
              inputTokens: true,
              outputTokens: true,
              cost: true,
            },
          });
          return { appId, stats };
        } catch (error) {
          console.error(`Error fetching stats for app ${appId}:`, error);
          return {
            appId,
            stats: {
              _count: 0,
              _sum: {
                totalTokens: 0,
                inputTokens: 0,
                outputTokens: 0,
                cost: 0,
              },
            },
          };
        }
      })
    );

    // Step 4: Batch fetch model usage for all apps
    const allModelUsage = await Promise.all(
      appIds.map(async appId => {
        try {
          const modelUsage = await db.llmTransaction.groupBy({
            by: ['model'],
            where: {
              echoAppId: appId,
              isArchived: false,
            },
            _count: true,
            _sum: {
              totalTokens: true,
              cost: true,
            },
            orderBy: {
              _sum: {
                totalTokens: 'desc',
              },
            },
          });
          return { appId, modelUsage };
        } catch (error) {
          console.error(`Error fetching model usage for app ${appId}:`, error);
          return { appId, modelUsage: [] };
        }
      })
    );

    // Step 5: Batch fetch recent transactions for all apps
    const allRecentTransactions = await Promise.all(
      appIds.map(async appId => {
        try {
          const recentTransactions = await db.llmTransaction.findMany({
            where: {
              echoAppId: appId,
              isArchived: false,
            },
            select: {
              id: true,
              model: true,
              totalTokens: true,
              cost: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          });
          return { appId, recentTransactions };
        } catch (error) {
          console.error(
            `Error fetching recent transactions for app ${appId}:`,
            error
          );
          return { appId, recentTransactions: [] };
        }
      })
    );

    // Step 6: Batch fetch activity data for all apps
    const allActivityData = await Promise.all(
      appIds.map(async appId => {
        try {
          const activity = await getAppActivity(appId);
          const activityData = transformActivityToChartData(activity);
          return { appId, activityData };
        } catch (error) {
          console.error(`Error fetching activity for app ${appId}:`, error);
          return { appId, activityData: [] };
        }
      })
    );

    // Step 7: Batch fetch user counts for all apps
    const allUserCounts = await Promise.all(
      appIds.map(async appId => {
        try {
          const numberOfUsers = await db.appMembership.count({
            where: {
              echoAppId: appId,
            },
          });
          return { appId, numberOfUsers };
        } catch (error) {
          console.error(`Error fetching user count for app ${appId}:`, error);
          return { appId, numberOfUsers: 0 };
        }
      })
    );

    // Step 8: Combine all data
    const apps: PublicEchoApp[] = publicApps.map(app => {
      const ownerMembership = ownerMemberships.find(
        om => om.echoAppId === app.id
      );
      const { stats } = allStats.find(s => s.appId === app.id) || {
        stats: {
          _count: 0,
          _sum: { totalTokens: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
        },
      };
      const { modelUsage } = allModelUsage.find(mu => mu.appId === app.id) || {
        modelUsage: [],
      };
      const { recentTransactions } = allRecentTransactions.find(
        rt => rt.appId === app.id
      ) || { recentTransactions: [] };
      const { activityData } = allActivityData.find(
        ad => ad.appId === app.id
      ) || { activityData: [] };
      const { numberOfUsers } = allUserCounts.find(
        uc => uc.appId === app.id
      ) || { numberOfUsers: 0 };

      return {
        ...app,
        createdAt: app.createdAt.toISOString(),
        updatedAt: app.updatedAt.toISOString(),
        githubType: app.githubType as 'user' | 'repo' | null,
        isPublic: true,
        userRole: AppRole.PUBLIC,
        permissions: [Permission.READ_APP],
        totalTokens: stats._sum.totalTokens || 0,
        totalCost: Number(stats._sum.cost || 0),
        authorizedCallbackUrls: [],
        _count: {
          apiKeys: 0,
          llmTransactions: stats._count || 0,
        },
        owner: ownerMembership?.user
          ? {
              id: ownerMembership.user.id,
              email: '', // Don't expose email for public apps
              name: ownerMembership.user.name,
              profilePictureUrl: null,
            }
          : {
              id: '',
              email: '',
              name: null,
              profilePictureUrl: null,
            },
        stats: {
          totalTransactions: stats._count || 0,
          totalTokens: stats._sum.totalTokens || 0,
          totalInputTokens: stats._sum.inputTokens || 0,
          totalOutputTokens: stats._sum.outputTokens || 0,
          totalCost: Number(stats._sum.cost || 0),
          modelUsage: modelUsage.map((usage: any) => ({
            model: usage.model,
            _count: usage._count,
            _sum: {
              totalTokens: usage._sum.totalTokens || 0,
              cost: Number(usage._sum.cost || 0),
            },
          })),
          numberOfUsers,
        },
        recentTransactions: recentTransactions.map((transaction: any) => ({
          ...transaction,
          cost: Number(transaction.cost),
          createdAt: transaction.createdAt.toISOString(),
        })),
        activityData,
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return {
      apps,
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  } catch (error) {
    console.error('Error in getPublicAppsInfo:', error);
    throw new Error(
      `Failed to fetch public apps: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

export const getDetailedAppInfo = async (
  appId: string,
  userId: string,
  globalView: boolean = false
): Promise<DetailedEchoApp | null> => {
  let userRole: AppRole = AppRole.PUBLIC;

  try {
    // Step 1: Get user's role for this app to determine what data to show
    try {
      userRole = await PermissionService.getUserAppRole(userId, appId);
    } catch (roleError) {
      console.error('STEP 1 FAILED - Failed to get user role:', {
        appId,
        userId,
        error: roleError instanceof Error ? roleError.message : 'Unknown error',
        errorStack: roleError instanceof Error ? roleError.stack : undefined,
        isDatabaseError:
          roleError instanceof Error &&
          (roleError.message.includes('Prisma') ||
            roleError.message.includes('database')),
      });
      // Re-throw the error so caller can handle it
      throw new Error(
        `Failed to get user role: ${roleError instanceof Error ? roleError.message : 'Unknown error'}`
      );
    }

    console.log('Fetching user info with permissions', userRole);

    // Step 2: If user has PUBLIC role, use the public function instead
    if (userRole === AppRole.PUBLIC) {
      try {
        const publicInfo = await getPublicAppInfo(appId);
        // Transform to match DetailedAppInfo structure for backward compatibility
        return {
          ...publicInfo,
          githubType: publicInfo.githubType as 'user' | 'repo' | null,
          isPublic: true, // Public apps are always public
          authorizedCallbackUrls: [],
          user: {
            ...publicInfo.owner,
            email: '', // Don't expose email for privacy reasons
          },
          apiKeys: [],
          stats: publicInfo.stats, // Use the full stats from public info
          recentTransactions: publicInfo.recentTransactions, // Use the actual recent transactions
        };
      } catch (publicError) {
        console.error('STEP 2 FAILED - Failed to fetch public app info:', {
          appId,
          userId,
          userRole: 'PUBLIC',
          operation: 'getPublicAppInfo',
          error:
            publicError instanceof Error
              ? publicError.message
              : 'Unknown error',
          errorStack:
            publicError instanceof Error ? publicError.stack : undefined,
          isDatabaseError:
            publicError instanceof Error &&
            (publicError.message.includes('Prisma') ||
              publicError.message.includes('database')),
          expectedError:
            publicError instanceof Error &&
            publicError.message ===
              'Echo app not found or not publicly accessible',
        });
        // Re-throw the error instead of returning null so caller can handle it
        throw publicError;
      }
    }

    // Step 3: Find the app (for non-public users)
    let app;
    try {
      app = await db.echoApp.findFirst({
        where: {
          id: appId,
          isArchived: false,
        },
        select: {
          id: true,
          name: true,
          description: true,
          profilePictureUrl: true,
          bannerImageUrl: true,
          homepageUrl: true,
          githubId: true,
          githubType: true,
          isActive: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
          authorizedCallbackUrls: true,
          apiKeys: {
            where: {
              isArchived: false,
              // Customers can only see their own API keys
              ...(userRole === AppRole.CUSTOMER && { userId }),
            },
            select: {
              id: true,
              name: true,
              isActive: true,
              createdAt: true,
              lastUsed: true,
              user: {
                select: {
                  email: true,
                  name: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              apiKeys: {
                where: {
                  isArchived: false,
                  ...(userRole === AppRole.CUSTOMER && { userId }),
                },
              },
              llmTransactions: {
                where: {
                  isArchived: false,
                  ...(userRole === AppRole.CUSTOMER && { userId }),
                },
              },
            },
          },
        },
      });
    } catch (appQueryError) {
      console.error('STEP 3 FAILED - Database error while fetching app:', {
        appId,
        userId,
        userRole,
        operation: 'db.echoApp.findFirst',
        error:
          appQueryError instanceof Error
            ? appQueryError.message
            : 'Unknown error',
        errorStack:
          appQueryError instanceof Error ? appQueryError.stack : undefined,
        isDatabaseError: true,
        prismaError:
          appQueryError instanceof Error &&
          appQueryError.message.includes('Prisma'),
      });
      throw new Error(
        `Database error while fetching app: ${appQueryError instanceof Error ? appQueryError.message : 'Unknown error'}`
      );
    }

    if (!app) {
      console.error('STEP 3 FAILED - App not found or access denied:', {
        appId,
        userId,
        userRole,
        operation: 'db.echoApp.findFirst result validation',
        reason:
          'Query returned null - app does not exist, is archived, or user lacks access',
      });
      throw new Error('Echo app not found or access denied');
    }

    // Step 4: Find the owner of the app
    let ownerMembership;
    try {
      ownerMembership = await db.appMembership.findFirst({
        where: {
          echoAppId: appId,
          role: AppRole.OWNER,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });
    } catch (ownerQueryError) {
      console.error(
        'STEP 4 FAILED - Database error while fetching app owner:',
        {
          appId,
          userId,
          userRole,
          operation: 'db.appMembership.findFirst (owner)',
          error:
            ownerQueryError instanceof Error
              ? ownerQueryError.message
              : 'Unknown error',
          errorStack:
            ownerQueryError instanceof Error
              ? ownerQueryError.stack
              : undefined,
          isDatabaseError: true,
          prismaError:
            ownerQueryError instanceof Error &&
            ownerQueryError.message.includes('Prisma'),
        }
      );
      throw new Error(
        `Database error while fetching app owner: ${ownerQueryError instanceof Error ? ownerQueryError.message : 'Unknown error'}`
      );
    }

    if (!ownerMembership) {
      console.error('STEP 4 FAILED - App owner not found:', {
        appId,
        userId,
        userRole,
        operation: 'db.appMembership.findFirst (owner) result validation',
        reason: 'No owner membership found - data integrity issue',
      });
      throw new Error('App owner not found');
    }

    // Step 5: Get aggregated statistics for the app (filtered by user for customers unless globalView is true)
    let stats;
    try {
      stats = await db.llmTransaction.aggregate({
        where: {
          echoAppId: appId,
          isArchived: false,
          // Filter by user for customers unless globalView is requested
          ...(userRole === AppRole.CUSTOMER && !globalView && { userId }),
        },
        _count: true,
        _sum: {
          totalTokens: true,
          inputTokens: true,
          outputTokens: true,
          cost: true,
        },
      });
    } catch (statsError) {
      console.error(
        'STEP 5 FAILED - Database error while fetching app statistics:',
        {
          appId,
          userId,
          userRole,
          globalView,
          operation: 'db.llmTransaction.aggregate (stats)',
          error:
            statsError instanceof Error ? statsError.message : 'Unknown error',
          errorStack:
            statsError instanceof Error ? statsError.stack : undefined,
          isDatabaseError: true,
          prismaError:
            statsError instanceof Error &&
            statsError.message.includes('Prisma'),
        }
      );
      // Provide default stats
      stats = {
        _count: 0,
        _sum: {
          totalTokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
        },
      };
    }

    // Step 6: Get model usage breakdown (filtered by user for customers unless globalView is true)
    let modelUsage: Array<{
      model: string;
      _count: number;
      _sum: { totalTokens: number | null; cost: number | null };
    }> = [];
    try {
      // @ts-expect-error - Prisma groupBy return type conflict with TypeScript strict mode
      modelUsage = await db.llmTransaction.groupBy({
        by: ['model'],
        where: {
          echoAppId: appId,
          isArchived: false,
          // Filter by user for customers unless globalView is requested
          ...(userRole === AppRole.CUSTOMER && !globalView && { userId }),
        },
        _count: true,
        _sum: {
          totalTokens: true,
          cost: true,
        },
        orderBy: {
          _sum: {
            totalTokens: 'desc',
          },
        },
      });
    } catch (modelUsageError) {
      console.error(
        'STEP 6 FAILED - Database error while fetching model usage:',
        {
          appId,
          userId,
          userRole,
          globalView,
          operation: 'db.llmTransaction.groupBy (model usage)',
          error:
            modelUsageError instanceof Error
              ? modelUsageError.message
              : 'Unknown error',
          errorStack:
            modelUsageError instanceof Error
              ? modelUsageError.stack
              : undefined,
          isDatabaseError: true,
          prismaError:
            modelUsageError instanceof Error &&
            modelUsageError.message.includes('Prisma'),
        }
      );
      modelUsage = [];
    }

    // Step 7: Get recent transactions (filtered by user for customers unless globalView is true)
    let recentTransactions: Array<{
      id: string;
      model: string;
      totalTokens: number;
      cost: number;
      status: string;
      createdAt: Date;
    }> = [];
    try {
      // @ts-expect-error - Prisma findMany return type inference issue
      recentTransactions = await db.llmTransaction.findMany({
        where: {
          echoAppId: appId,
          isArchived: false,
          // Filter by user for customers unless globalView is requested
          ...(userRole === AppRole.CUSTOMER && !globalView && { userId }),
        },
        select: {
          id: true,
          model: true,
          totalTokens: true,
          cost: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    } catch (transactionsError) {
      console.error(
        'STEP 7 FAILED - Database error while fetching recent transactions:',
        {
          appId,
          userId,
          userRole,
          globalView,
          operation: 'db.llmTransaction.findMany (recent transactions)',
          error:
            transactionsError instanceof Error
              ? transactionsError.message
              : 'Unknown error',
          errorStack:
            transactionsError instanceof Error
              ? transactionsError.stack
              : undefined,
          isDatabaseError: true,
          prismaError:
            transactionsError instanceof Error &&
            transactionsError.message.includes('Prisma'),
        }
      );
      recentTransactions = [];
    }

    // Step 8: Get activity data for the last 7 days (filtered by user for customers unless globalView is true)
    let activityData: number[] = [];
    try {
      const activity = await getAppActivity(
        appId,
        7,
        userRole === AppRole.CUSTOMER && !globalView ? userId : undefined
      );
      activityData = transformActivityToChartData(activity);
    } catch (activityError) {
      console.error('STEP 8 FAILED - Error while fetching app activity:', {
        appId,
        userId,
        userRole,
        globalView,
        operation: 'getAppActivity + transformActivityToChartData',
        error:
          activityError instanceof Error
            ? activityError.message
            : 'Unknown error',
        errorStack:
          activityError instanceof Error ? activityError.stack : undefined,
        isDatabaseError:
          activityError instanceof Error &&
          (activityError.message.includes('Prisma') ||
            activityError.message.includes('database')),
      });
      activityData = [];
    }

    // Step 9: Calculate total spent for each API key
    let apiKeysWithSpending;
    try {
      apiKeysWithSpending = await Promise.all(
        app.apiKeys.map(async apiKey => {
          try {
            // Get total spending for this API key using the new apiKeyId field
            const spendingResult = await db.llmTransaction.aggregate({
              where: {
                apiKeyId: apiKey.id,
                isArchived: false,
              },
              _sum: {
                cost: true,
              },
            });

            const totalSpent = Number(spendingResult._sum.cost || 0);

            return {
              ...apiKey,
              totalSpent,
              creator: apiKey.user,
            };
          } catch (apiKeySpendingError) {
            console.error(
              'STEP 9 SUB-OPERATION FAILED - Error fetching spending for API key:',
              {
                apiKeyId: apiKey.id,
                appId,
                userId,
                userRole,
                operation: 'db.llmTransaction.aggregate (API key spending)',
                error:
                  apiKeySpendingError instanceof Error
                    ? apiKeySpendingError.message
                    : 'Unknown error',
                errorStack:
                  apiKeySpendingError instanceof Error
                    ? apiKeySpendingError.stack
                    : undefined,
                isDatabaseError: true,
                prismaError:
                  apiKeySpendingError instanceof Error &&
                  apiKeySpendingError.message.includes('Prisma'),
              }
            );
            // Return API key with zero spending if query fails
            return {
              ...apiKey,
              totalSpent: 0,
              creator: apiKey.user,
            };
          }
        })
      );
    } catch (apiKeysError) {
      console.error('STEP 9 FAILED - Error processing API keys spending:', {
        appId,
        userId,
        userRole,
        operation:
          'Promise.all(apiKeys.map(...)) - API keys spending calculation',
        error:
          apiKeysError instanceof Error
            ? apiKeysError.message
            : 'Unknown error',
        errorStack:
          apiKeysError instanceof Error ? apiKeysError.stack : undefined,
        isDatabaseError:
          apiKeysError instanceof Error &&
          (apiKeysError.message.includes('Prisma') ||
            apiKeysError.message.includes('database')),
      });
      // Return API keys without spending data
      apiKeysWithSpending = app.apiKeys.map(apiKey => ({
        ...apiKey,
        totalSpent: 0,
        creator: apiKey.user,
      }));
    }

    const numberOfUsers = await db.appMembership.count({
      where: {
        echoAppId: appId,
      },
    });

    return {
      ...app,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      githubType: app.githubType as 'user' | 'repo' | null,
      user: {
        id: ownerMembership.user.id,
        email: ownerMembership.user.email,
        name: ownerMembership.user.name,
        profilePictureUrl: null,
      },
      userRole,
      permissions: PermissionService.getPermissionsForRole(userRole),
      totalTokens: stats._sum.totalTokens || 0,
      totalCost: Number(stats._sum.cost || 0),
      owner: ownerMembership?.user
        ? {
            id: ownerMembership.user.id,
            email: ownerMembership.user.email,
            name: ownerMembership.user.name,
            profilePictureUrl: null,
          }
        : {
            id: '',
            email: '',
            name: null,
            profilePictureUrl: null,
          },
      _count: {
        apiKeys: app._count.apiKeys,
        llmTransactions: app._count.llmTransactions,
      },
      apiKeys: apiKeysWithSpending.map(key => ({
        ...key,
        name: key.name || undefined,
        createdAt: key.createdAt.toISOString(),
        lastUsed: key.lastUsed?.toISOString(),
        creator: key.creator
          ? {
              email: key.creator.email,
              name: key.creator.name || undefined,
            }
          : null,
      })),
      stats: {
        totalTransactions: stats._count || 0,
        totalTokens: stats._sum.totalTokens || 0,
        totalInputTokens: stats._sum.inputTokens || 0,
        totalOutputTokens: stats._sum.outputTokens || 0,
        totalCost: Number(stats._sum.cost || 0),
        modelUsage: modelUsage.map(usage => ({
          ...usage,
          _sum: {
            totalTokens: usage._sum.totalTokens || 0,
            cost: Number(usage._sum.cost || 0),
          },
        })),
        numberOfUsers: numberOfUsers,
      },
      recentTransactions: recentTransactions.map(transaction => ({
        ...transaction,
        cost: Number(transaction.cost),
        createdAt: transaction.createdAt.toISOString(),
      })),
      activityData,
    };
  } catch (error) {
    // Catch-all for any other unexpected errors - this should now be much rarer
    console.error('UNEXPECTED ERROR in getDetailedAppInfo (outer catch-all):', {
      appId,
      userId,
      globalView,
      userRole,
      operation: 'getDetailedAppInfo - unexpected error in outer try-catch',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      isDatabaseError:
        error instanceof Error &&
        (error.message.includes('Prisma') ||
          error.message.includes('database')),
      timestamp: new Date().toISOString(),
      note: 'This should be rare now that all steps have specific error handling',
    });

    // Return null instead of throwing
    return null;
  }
};

export const createEchoApp = async (userId: string, data: AppCreateInput) => {
  // Validate input
  const nameError = validateAppName(data.name);
  if (nameError) {
    throw new Error(nameError);
  }

  const descriptionError = validateAppDescription(data.description);
  if (descriptionError) {
    throw new Error(descriptionError);
  }

  const githubIdError = validateGithubId(data.githubId);
  if (githubIdError) {
    throw new Error(githubIdError);
  }

  const githubTypeError = validateGithubType(data.githubType);
  if (githubTypeError) {
    throw new Error(githubTypeError);
  }

  const echoApp = await db.echoApp.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      githubType: data.githubType || null,
      githubId: data.githubId?.trim() || null,
      appMemberships: {
        create: {
          userId,
          role: AppRole.OWNER,
          status: MembershipStatus.ACTIVE,
          isArchived: false,
          totalSpent: 0,
        },
      },
      isActive: true,
      authorizedCallbackUrls: data.authorizedCallbackUrls || [], // Start with empty callback URLs
    },
    select: {
      id: true,
      name: true,
      description: true,
      githubType: true,
      githubId: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      authorizedCallbackUrls: true,
    },
  });

  return echoApp;
};

export const updateEchoAppById = async (
  appId: string,
  userId: string,
  data: AppUpdateInput
) => {
  // Check if user has permission to edit this app
  const hasEditPermission = await PermissionService.hasPermission(
    userId,
    appId,
    Permission.EDIT_APP
  );

  if (!hasEditPermission) {
    throw new Error('Echo app not found or access denied');
  }

  // Validate input if provided
  if (data.name !== undefined) {
    const nameError = validateAppName(data.name);
    if (nameError) {
      throw new Error(nameError);
    }
  }

  if (data.description !== undefined) {
    const descriptionError = validateAppDescription(data.description);
    if (descriptionError) {
      throw new Error(descriptionError);
    }
  }

  if (data.githubId !== undefined) {
    const githubIdError = validateGithubId(data.githubId);
    if (githubIdError) {
      throw new Error(githubIdError);
    }
  }

  if (data.githubType !== undefined) {
    const githubTypeError = validateGithubType(data.githubType);
    if (githubTypeError) {
      throw new Error(githubTypeError);
    }
  }

  if (data.homepageUrl !== undefined) {
    const homepageUrlError = validateHomepageUrl(data.homepageUrl);
    if (homepageUrlError) {
      throw new Error(homepageUrlError);
    }
  }

  // Verify the echo app exists and is not archived
  const existingApp = await db.echoApp.findFirst({
    where: {
      id: appId,
      isArchived: false, // Only allow updating non-archived apps
    },
  });

  if (!existingApp) {
    throw new Error('Echo app not found or access denied');
  }

  // Update the app
  const updatedApp = await db.echoApp.update({
    where: { id: appId },
    data: {
      ...(data.name && { name: data.name.trim() }),
      ...(data.description !== undefined && {
        description: data.description?.trim() || null,
      }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.githubType !== undefined && { githubType: data.githubType }),
      ...(data.githubId !== undefined && {
        githubId: data.githubId?.trim() || null,
      }),
      ...(data.profilePictureUrl !== undefined && {
        profilePictureUrl: data.profilePictureUrl?.trim() || null,
      }),
      ...(data.bannerImageUrl !== undefined && {
        bannerImageUrl: data.bannerImageUrl?.trim() || null,
      }),
      ...(data.homepageUrl !== undefined && {
        homepageUrl: data.homepageUrl?.trim() || null,
      }),
      ...(data.authorizedCallbackUrls !== undefined && {
        authorizedCallbackUrls: data.authorizedCallbackUrls,
      }),
      ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
    },
    include: {
      apiKeys: {
        select: {
          id: true,
          name: true,
          isActive: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          apiKeys: true,
          llmTransactions: true,
        },
      },
    },
  });

  return updatedApp;
};

export const deleteEchoAppById = async (appId: string, userId: string) => {
  // Check if user has permission to delete this app
  const hasDeletePermission = await PermissionService.hasPermission(
    userId,
    appId,
    Permission.DELETE_APP
  );

  if (!hasDeletePermission) {
    throw new Error('Echo app not found or access denied');
  }

  // Verify the echo app exists and is not archived
  const existingApp = await db.echoApp.findFirst({
    where: {
      id: appId,
      isArchived: false, // Only allow archiving non-archived apps
    },
  });

  if (!existingApp) {
    throw new Error('Echo app not found or access denied');
  }

  // Soft delete the echo app and all related records
  await softDeleteEchoApp(appId);

  return {
    success: true,
    message: 'Echo app and related data archived successfully',
  };
};

// Legacy functions for backward compatibility
export const findEchoApp = async (
  id: string,
  userId: string
): Promise<EchoApp | null> => {
  const echoApp = await db.echoApp.findFirst({
    where: {
      id,
      appMemberships: {
        some: {
          userId,
          status: MembershipStatus.ACTIVE,
          isArchived: false,
        },
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      profilePictureUrl: true,
      bannerImageUrl: true,
      homepageUrl: true,
      markUp: true,
      githubId: true,
      githubType: true,
      isActive: true,
      isPublic: true,
      authorizedCallbackUrls: true,
      isArchived: true,
      archivedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return echoApp;
};

export const updateEchoApp = async (
  id: string,
  userId: string,
  data: Prisma.EchoAppUpdateInput,
  select?: Prisma.EchoAppSelect
): Promise<EchoApp> => {
  const echoApp = await findEchoApp(id, userId);

  if (!echoApp) {
    throw new Error('Echo app not found');
  }

  return db.echoApp.update({
    where: { id },
    data,
    select,
  });
};
