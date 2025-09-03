import { api } from '@/trpc/server';

export const Feed = async () => {
  const result = await api.user.feed.get();

  console.log(result);

  return <div>Feed</div>;
};

export const LoadingFeed = () => {
  return <div>LoadingFeed</div>;
};
