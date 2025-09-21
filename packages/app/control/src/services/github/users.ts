import 'server-only';
import { githubClient } from './client';

export type SearchUsersResponse = Awaited<
  ReturnType<typeof githubClient.rest.search.users>
>['data'];
export type SearchedUser = SearchUsersResponse['items'][number];

export const searchUsers = async (
  q: string
): Promise<SearchUsersResponse | null> => {
  try {
    const res = await githubClient.rest.search.users({ q });
    return res.data;
  } catch (error) {
    console.error('Error searching GitHub users:', error);
    return null;
  }
};

export const getUser = async (
  username: string
): Promise<SearchedUser | null> => {
  try {
    const data = await searchUsers(username);
    if (!data) return null;
    return (
      data.items?.find(
        user => user.login?.toLowerCase() === username.toLowerCase()
      ) ?? null
    );
  } catch (error) {
    console.error('Error getting GitHub user:', error);
    return null;
  }
};
