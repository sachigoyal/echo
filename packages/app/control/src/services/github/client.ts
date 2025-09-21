import { env } from '@/env';
import { Octokit } from 'octokit';

export const githubClient = new Octokit({
  auth: env.GITHUB_TOKEN,
});
