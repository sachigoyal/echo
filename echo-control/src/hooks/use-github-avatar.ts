import { useCallback } from 'react';

export const useGithubAvatar = () => {
  const fetchAvatar = useCallback(async (type: 'user' | 'repo', rawUrl: string) => {
    try {
      const slug = (rawUrl || '')
        .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
        .replace(/^\/?|\/?$/g, '');
      if (!slug) return null;

      if (type === 'user') {
        const username = slug.split('/')[0];
        if (!username) return null;
        const res = await fetch(`https://api.github.com/users/${username}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data?.avatar_url ?? null;
      } else {
        const [owner, repo] = slug.split('/');
        if (!owner || !repo) return null;
        const res = await fetch(
          `https://api.github.com/repos/${owner}/${repo}`
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data?.owner?.avatar_url ?? data?.avatar_url ?? null;
      }
    } catch {
      return null;
    }
  }, []);

  return { fetchAvatar };
};
