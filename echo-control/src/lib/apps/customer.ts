import { db } from '@/lib/db';
import { CustomerEchoApp } from './types';
import { getOwnerDetails, getOwnerDetailsBatch } from './owner';
import {
  getCustomerStatistics,
  getCustomerStatisticsBatch,
} from './customer-statistics';
import { AppRole } from '../permissions';

/**
 * Get customer echo app with personal and global statistics
 * @param id - The ID of the echo app
 * @param userId - The ID of the customer/user
 * @returns Customer echo app with owner details and customer statistics
 */
export async function getCustomerEchoApp(
  id: string,
  userId: string
): Promise<CustomerEchoApp> {
  // Use a transaction to ensure consistency
  return await db.$transaction(async tx => {
    // Get the base echo app
    const echoApp = await tx.echoApp.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        profilePictureUrl: true,
        bannerImageUrl: true,
        homepageUrl: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!echoApp) {
      throw new Error('Echo app not found');
    }

    // Get owner details
    const owner = await getOwnerDetails(id, tx);
    if (!owner) {
      throw new Error('Echo app owner not found');
    }

    // Get customer statistics (includes both global and personal stats)
    const stats = await getCustomerStatistics(id, userId, tx);

    // Construct and return the customer echo app
    return {
      ...echoApp,
      owner,
      stats,
      type: 'customer',
    };
  });
}

/**
 * Get all customer echo apps for a specific user with their details in a single batch operation
 * This fetches all apps where the user is a member (customer) with full statistics
 * @param userId - The ID of the customer/user
 * @returns Array of all customer echo apps with owner and statistics
 */
export async function getAllCustomerEchoApps(
  userId: string
): Promise<CustomerEchoApp[]> {
  // Use a transaction to ensure consistency
  return await db.$transaction(async tx => {
    // Step 1: Get all app memberships for this user
    const userMemberships = await tx.appMembership.findMany({
      where: {
        userId,
        isArchived: false,
        role: {
          not: AppRole.OWNER,
        },
      },
      select: {
        echoAppId: true,
        role: true,
      },
    });

    if (userMemberships.length === 0) {
      return [];
    }

    const appIds = userMemberships.map(m => m.echoAppId);

    // Step 2: Get all echo apps where user is a member
    const echoApps = await tx.echoApp.findMany({
      where: {
        id: { in: appIds },
        isArchived: false,
      },
      select: {
        id: true,
        name: true,
        description: true,
        profilePictureUrl: true,
        bannerImageUrl: true,
        homepageUrl: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (echoApps.length === 0) {
      return [];
    }

    // Step 3: Batch fetch owner details for all apps
    const ownersMap = await getOwnerDetailsBatch(appIds, tx);

    // Step 4: Batch fetch customer statistics for all apps
    const statsMap = await getCustomerStatisticsBatch(appIds, userId, tx);

    // Step 5: Combine all data
    const customerApps: CustomerEchoApp[] = [];

    for (const echoApp of echoApps) {
      const owner = ownersMap.get(echoApp.id);
      const stats = statsMap.get(echoApp.id);

      // Skip apps without owner or stats (shouldn't happen but defensive)
      if (!owner || !stats) {
        console.error(`Missing owner or stats for app ${echoApp.id}`);
        continue;
      }

      customerApps.push({
        ...echoApp,
        owner,
        stats,
        type: 'customer',
      });
    }

    return customerApps;
  });
}
