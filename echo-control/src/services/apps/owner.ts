import { z } from 'zod';

import { db } from '@/lib/db';

import { AppRole, MembershipStatus } from '@/lib/permissions/types';
import { getRepo } from '../github/repo';
import { getUser } from '../github/users';

export const createAppSchema = z.object({
  name: z
    .string()
    .min(1, 'App name is required')
    .max(100, 'App name must be 100 characters or less'),
  markup: z
    .number()
    .min(1, 'Markup must be greater than 0')
    .max(100, 'Markup must be less than 100'),
});

export const createApp = async (
  userId: string,
  data: z.infer<typeof createAppSchema>
) => {
  const validatedData = createAppSchema.safeParse(data);

  if (!validatedData.success) {
    throw new Error(validatedData.error.message);
  }

  return await db.echoApp.create({
    data: {
      name: data.name.trim(),
      markUp: {
        create: {
          amount: data.markup,
        },
      },
      appMemberships: {
        create: {
          userId,
          role: AppRole.OWNER,
          status: MembershipStatus.ACTIVE,
          isArchived: false,
          totalSpent: 0,
        },
      },
      authorizedCallbackUrls: [],
    },
  });
};

export const listOwnedApps = async (userId: string) => {
  return await db.echoApp.findMany({
    where: {
      appMemberships: {
        some: { userId, role: AppRole.OWNER },
      },
    },
  });
};

export const updateAppSchema = z
  .object({
    description: z.string().min(1, 'Description is required').optional(),
    homepageUrl: z.string().min(1, 'Homepage URL is required').optional(),
    profilePictureUrl: z.url().optional(),
  })
  .refine(
    data => {
      // Ensure at least one of the fields is defined
      return (
        data.description !== undefined ||
        data.homepageUrl !== undefined ||
        data.profilePictureUrl !== undefined
      );
    },
    {
      message: 'At least one field must be provided',
      path: [],
    }
  );

export const updateApp = async (
  appId: string,
  data: z.infer<typeof updateAppSchema>
) => {
  const validatedData = updateAppSchema.safeParse(data);

  if (!validatedData.success) {
    throw new Error(validatedData.error.message);
  }

  return await db.echoApp.update({
    where: { id: appId },
    data: {
      description: data.description?.trim(),
      homepageUrl: data.homepageUrl?.trim(),
      profilePictureUrl: data.profilePictureUrl?.trim(),
    },
  });
};

export const updateGithubLinkSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('user'),
    url: z
      .url()
      .refine(
        val => /^https:\/\/github\.com\/[A-Za-z0-9_.-]+(\/)?$/.test(val),
        {
          message:
            'Must be a valid GitHub user URL (e.g. https://github.com/owner)',
        }
      ),
  }),
  z.object({
    type: z.literal('repo'),
    url: z
      .url()
      .refine(
        val =>
          /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(\/)?$/.test(
            val
          ),
        {
          message:
            'Must be a valid GitHub repository URL (e.g. https://github.com/owner/repo)',
        }
      ),
  }),
]);

export const getGithubLink = async (appId: string) => {
  return await db.githubLink.findUnique({
    where: { echoAppId: appId },
  });
};

export const updateGithubLink = async (
  appId: string,
  data: z.infer<typeof updateGithubLinkSchema>
) => {
  const validatedData = updateGithubLinkSchema.safeParse(data);

  if (!validatedData.success) {
    throw new Error(validatedData.error.message);
  }

  let githubId: number;
  if (data.type === 'user') {
    const username = data.url.split('/').pop();
    if (!username) {
      throw new Error('Invalid GitHub user URL');
    }
    const user = await getUser(username);
    if (!user) {
      throw new Error('User not found');
    }
    githubId = user.id;
  } else {
    const [owner, repoName] = data.url.split('/').slice(-2);
    const repo = await getRepo(owner, repoName);
    if (!repo) {
      throw new Error('Repository not found');
    }
    githubId = repo.id;
  }

  return await db.githubLink.upsert({
    where: { echoAppId: appId },
    update: {
      githubId,
      githubType: data.type,
      githubUrl: data.url.toString(),
    },
    create: {
      echoAppId: appId,
      githubId,
      githubType: data.type,
      githubUrl: data.url.toString(),
    },
  });
};
