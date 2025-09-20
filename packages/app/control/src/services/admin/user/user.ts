import { db } from '@/services/db/db';

export const getUser = async (userId: string) => {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
      createdAt: true,
      email: true,
      totalPaid: true,
      totalSpent: true,
    },
  });
  return user;
};
