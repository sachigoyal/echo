import { useSession } from 'next-auth/react';

export const useUser = () => {
  const { data: session, status } = useSession();

  const isLoaded = status !== 'loading';
  const isAuthenticated = status === 'authenticated';

  return {
    user: session?.user,
    isLoaded,
    isAuthenticated,
  };
};
