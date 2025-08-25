import { EchoApp, Prisma } from '@/generated/prisma';
import { db } from '@/lib/db';
import { PermissionService } from '@/lib/permissions/service';
import { Permission } from '@/lib/permissions/types';
import { AppUpdateInput, OwnerEchoApp } from '@/lib/apps/types';
import { getOwnerEchoApp } from '@/lib/apps/owner';
import {
  findEchoApp,
  validateAppDescription,
  validateAppName,
  validateGithubId,
  validateGithubType,
  validateHomepageUrl,
} from '.';

export const updateEchoAppById = async (
  appId: string,
  userId: string,
  data: AppUpdateInput
): Promise<OwnerEchoApp> => {
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

  // Handle GitHub link updates separately
  const needsGithubUpdate =
    data.githubId !== undefined || data.githubType !== undefined;

  if (needsGithubUpdate) {
    // Check if we need to create, update, or delete the GitHub link
    const githubId = data.githubId?.trim();
    const githubType = data.githubType;

    if (githubId && githubType) {
      // Create or update GitHub link with both ID and type
      await db.githubLink.upsert({
        where: {
          echoAppId: appId,
        },
        update: {
          githubId: parseInt(githubId),
          githubUrl: '',
          githubType,
          description: `GitHub ${githubType} link`,
          isArchived: false,
        },
        create: {
          echoAppId: appId,
          githubId: parseInt(githubId),
          githubUrl: '',
          githubType,
          description: `GitHub ${githubType} link`,
          isArchived: false,
        },
      });
    } else if (githubId && !githubType) {
      // Update only the GitHub ID, keeping existing type or defaulting to 'repo'
      const existingLink = await db.githubLink.findFirst({
        where: { echoAppId: appId, isArchived: false },
      });

      const typeToUse = existingLink?.githubType || 'repo'; // default to 'repo' if no existing link

      await db.githubLink.upsert({
        where: {
          echoAppId: appId,
        },
        update: {
          githubId: parseInt(githubId),
          githubType: typeToUse,
          description: `GitHub ${typeToUse} link`,

          isArchived: false,
        },
        create: {
          echoAppId: appId,
          githubId: parseInt(githubId),
          githubUrl: '',
          githubType: typeToUse,
          description: `GitHub ${typeToUse} link`,

          isArchived: false,
        },
      });
    } else if (githubId === null || githubId === '') {
      // Delete GitHub link if githubId is explicitly set to null/empty
      await db.githubLink.updateMany({
        where: {
          echoAppId: appId,
        },
        data: {
          isArchived: true,
          archivedAt: new Date(),
        },
      });
    }
  }

  // Update the app
  await db.echoApp.update({
    where: { id: appId },
    data: {
      ...(data.name && { name: data.name.trim() }),
      ...(data.description !== undefined && {
        description: data.description?.trim() || null,
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

          createdAt: true,
        },
      },
      githubLink: {
        select: {
          id: true,
          githubId: true,
          githubType: true,
          description: true,
        },
      },
      _count: {
        select: {
          apiKeys: true,
          Transactions: true,
        },
      },
    },
  });

  const ownerApp = await getOwnerEchoApp(appId, userId);

  return ownerApp;
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
