import { EchoApp } from '@/generated/prisma';
import { db } from '../../db';
import { AppRole, MembershipStatus } from '../../permissions/types';
import { PermissionService } from '../../permissions/service';
import { Permission } from '../../permissions/types';
import { softDeleteEchoApp } from '../soft-delete';
import { AppCreateInput } from '../types';

import { isValidUrl } from '@/lib/utils';

export * from './update';

// Legacy type for backward compatibility with existing list views

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

  // Validate isPublic
  if (data.isPublic !== undefined) {
    if (typeof data.isPublic !== 'boolean') {
      return 'isPublic must be a boolean';
    }
  }

  return null; // No validation errors
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

  // Prepare Github link data if provided
  const githubLinkData =
    data.githubId?.trim() && data.githubType
      ? {
          githubLink: {
            create: {
              githubId: data.githubId.trim(),
              githubType: data.githubType,
              description: `GitHub ${data.githubType} link`,

              isArchived: false,
            },
          },
        }
      : {};

  const echoApp = await db.echoApp.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      appMemberships: {
        create: {
          userId,
          role: AppRole.OWNER,
          status: MembershipStatus.ACTIVE,
          isArchived: false,
          totalSpent: 0,
        },
      },
      authorizedCallbackUrls: data.authorizedCallbackUrls || [], // Start with empty callback URLs
      ...githubLinkData,
    },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      authorizedCallbackUrls: true,
      githubLink: {
        select: {
          id: true,
          githubId: true,
          githubType: true,
          description: true,
        },
      },
    },
  });

  return echoApp;
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
      githubLink: {
        select: {
          githubId: true,
          githubType: true,
        },
        where: {
          isArchived: false,
        },
      },
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
