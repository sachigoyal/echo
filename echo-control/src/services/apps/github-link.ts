import { z } from 'zod';

import { db } from '@/lib/db';

import { getRepo } from '../github/repo';
import { getUser } from '../github/users';

export const getGithubLink = async (appId: string) => {
  return await db.githubLink.findUnique({
    where: { echoAppId: appId },
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
