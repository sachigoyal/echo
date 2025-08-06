import { db } from '@/lib/db';
import { PublicEchoApp } from './types';
import { getOwnerDetails, getOwnerDetailsBatch } from './owner';
import {
  getGlobalStatistics,
  getGlobalStatisticsBatch,
} from './globalStatistics';

export async function getPublicEchoApp(id: string): Promise<PublicEchoApp> {
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

    // Get global statistics
    const stats = await getGlobalStatistics(id, tx);

    // Construct and return the public echo app
    return {
      ...echoApp,
      owner,
      stats,
      type: 'public',
    } as PublicEchoApp;
  });
}

/**
 * Get all public echo apps with their details in a single batch operation
 * This is optimized for fetching multiple apps at once to reduce database queries
 * @returns Array of all public echo apps with owner and statistics
 */
export async function getAllPublicEchoApps(): Promise<PublicEchoApp[]> {
  // Use a transaction to ensure consistency
  return await db.$transaction(async tx => {
    // Step 1: Get all public echo apps
    const echoApps = await tx.echoApp.findMany({
      where: {
        isPublic: true,
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

    const appIds = echoApps.map(app => app.id);

    // Step 2: Batch fetch owner details for all apps
    const ownersMap = await getOwnerDetailsBatch(appIds, tx);

    // Step 3: Batch fetch global statistics for all apps
    const statsMap = await getGlobalStatisticsBatch(appIds, tx);

    // Step 4: Combine all data
    const publicApps: PublicEchoApp[] = [];

    for (const echoApp of echoApps) {
      const owner = ownersMap.get(echoApp.id);
      const stats = statsMap.get(echoApp.id);

      // Skip apps without owner or stats (shouldn't happen but defensive)
      if (!owner || !stats) {
        console.error(`Missing owner or stats for app ${echoApp.id}`);
        continue;
      }

      publicApps.push({
        ...echoApp,
        owner,
        stats,
        type: 'public',
      });
    }

    return publicApps;
  });
}
