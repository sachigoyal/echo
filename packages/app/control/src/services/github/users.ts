import { githubClient } from './client';

export const getUser = async (username: string) => {
  return githubClient.rest.users
    .getByUsername({
      username,
    })
    .then(res => res.data)
    .catch(error => {
      console.error('Error getting GitHub user:', error);
      return null;
    });
};
