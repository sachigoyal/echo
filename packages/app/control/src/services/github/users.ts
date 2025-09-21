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

export const searchUser = async (query: string) => {
  return githubClient.rest.search
    .users({
      q: query,
    })
    .then(res => res.data)
    .catch(error => {
      console.error('Error searching GitHub user:', error);
      return null;
    });
};
