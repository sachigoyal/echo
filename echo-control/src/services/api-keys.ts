import { z } from 'zod';

import { ApiKey, Prisma } from '@/generated/prisma';
import { db } from '../lib/db';
import {
  AppRole,
  MembershipStatus,
  Permission,
} from '../lib/permissions/types';
import { PermissionService } from '../lib/permissions';
import { generateApiKey, hashApiKey } from '../lib/crypto';
import { paginationParamsSchema } from '@/lib/pagination';
import { PaginatedResponse } from '@/types/paginated-response';

export const getApiKeySchema = z.string();

export const getApiKey = async (
  userId: string,
  id: z.infer<typeof getApiKeySchema>
): Promise<ApiKey | null> => {
  return db.apiKey.findFirst({
    where: {
      id,
      userId,
      isArchived: false,
    },
  });
};

const listUserApiKeysWhere = (userId: string): Prisma.ApiKeyWhereInput => {
  return {
    userId,
    isArchived: false,
    echoApp: {
      isArchived: false,
      appMemberships: {
        some: {
          userId,
          status: MembershipStatus.ACTIVE,
        },
      },
    },
  };
};

export const listApiKeys = async (
  userId: string,
  { page = 0, page_size = 10 }: z.infer<typeof paginationParamsSchema>
): Promise<PaginatedResponse<ApiKey>> => {
  const skip = page * page_size;

  const [totalCount, apiKeys] = await Promise.all([
    db.apiKey.count({
      where: listUserApiKeysWhere(userId),
    }),
    db.apiKey.findMany({
      where: listUserApiKeysWhere(userId),
      skip,
      take: page_size,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / page_size);

  return {
    items: apiKeys,
    page,
    page_size,
    total_count: totalCount,
    has_next: page < totalPages - 1,
  };
};

export const createApiKeySchema = z.object({
  echoAppId: z.string(),
  name: z.string(),
});

export async function createApiKey(
  userId: string,
  { echoAppId, name }: z.infer<typeof createApiKeySchema>
) {
  // Check permissions using the new permission system
  const hasCreatePermission = await PermissionService.hasPermission(
    userId,
    echoAppId,
    Permission.CREATE_API_KEYS
  );

  const hasManageOwnPermission = await PermissionService.hasPermission(
    userId,
    echoAppId,
    Permission.MANAGE_OWN_API_KEYS
  );

  if (!hasCreatePermission && !hasManageOwnPermission) {
    throw new Error('Permission denied');
  }

  const userRole = await PermissionService.getUserAppRole(userId, echoAppId);
  const scope =
    userRole === AppRole.OWNER || userRole === AppRole.ADMIN
      ? 'owner'
      : 'customer';

  // Generate a new API key
  const generatedKey = generateApiKey();

  // Hash the API key for secure storage (deterministic for O(1) lookup)
  const keyHash = hashApiKey(generatedKey);

  // Create the API key
  const apiKey = await db.apiKey.create({
    data: {
      keyHash,
      name: name || 'API Key',
      userId,
      echoAppId,
      scope,
    },
    include: {
      echoApp: true,
    },
  });

  // Return the API key with the original plaintext key for the user to save
  const response = {
    ...apiKey,
    key: generatedKey, // Include the plaintext key in the response for the user to copy
  };

  return response;
}

export const updateApiKeySchema = z.object({
  id: z.string(),
  data: z.object({
    name: z.string(),
  }),
});

export async function updateApiKey(
  userId: string,
  { id, data }: z.infer<typeof updateApiKeySchema>
): Promise<ApiKey> {
  return db.apiKey.update({
    where: { id, userId },
    data,
  });
}

export const deleteApiKeySchema = z.string();

export async function deleteApiKey(
  userId: string,
  id: z.infer<typeof deleteApiKeySchema>
) {
  const now = new Date();
  return await db.apiKey.update({
    where: { id, userId },
    data: {
      isArchived: true,
      archivedAt: now,
    },
  });
}
