import { z } from 'zod';

import { db } from '@/lib/db';

import { getRepo } from '../github/repo';
import { getUser } from '../github/users';

export const getGithubLinkForUser = async (userId: string) => {
  return await db.githubLink.findUnique({
    where: { userId },
  });
};

export const updateUserGithubLinkSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('user'),
    url: z
      .string()
      .url()
      .refine(val => /^https:\/\/github\.com\/[A-Za-z0-9_.-]+(\/)?$/.test(val), {
        message:
          'Must be a valid GitHub user URL (e.g. https://github.com/owner)',
      }),
  }),
  z.object({
    type: z.literal('repo'),
    url: z
      .string()
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

export const updateGithubLinkForUser = async (
  userId: string,
  data: z.infer<typeof updateUserGithubLinkSchema>
) => {
  const validatedData = updateUserGithubLinkSchema.safeParse(data);

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

  const githubLink = await db.githubLink.upsert({
    where: { userId },
    update: {
      githubId,
      githubType: data.type,
      githubUrl: data.url.toString(),
      isArchived: false,
      archivedAt: null,
    },
    create: {
      userId,
      githubId,
      githubType: data.type,
      githubUrl: data.url.toString(),
      isArchived: false,
    },
  });

  await db.user.update({
    where: { id: userId },
    data: { referralGithubUserId: githubLink.id },
  });

  return githubLink;
};
