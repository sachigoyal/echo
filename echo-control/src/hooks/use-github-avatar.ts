import { useCallback } from 'react';

export type GithubEntityType = 'user' | 'repo';

export const useGithubAvatar = () => {
  const fetchAvatar = useCallback(
    async (type: GithubEntityType, githubUrl: string) => {
      try {
        const path = githubUrl.replace('https://github.com/', '');
        if (!path) return null;

        if (type === 'user') {
          const username = path.split('/')[0];
          if (!username) return null;
          const res = await fetch(`https://api.github.com/users/${username}`);
          if (!res.ok) return null;
          const data = await res.json();
          return data.avatar_url;
        } else {
          const [owner, repo] = path.split('/');
          if (!owner || !repo) return null;
          const res = await fetch(
            `https://api.github.com/repos/${owner}/${repo}`
          );
          if (!res.ok) return null;
          const data = await res.json();
          return data.owner.avatar_url;
        }
      } catch {
        return null;
      }
    },
    []
  );

  return { fetchAvatar };
};
