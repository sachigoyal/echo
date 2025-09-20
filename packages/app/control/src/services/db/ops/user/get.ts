import { db } from '@/services/db/client';

const publicUserSelect = {
  id: true,
  name: true,
  image: true,
  createdAt: true,
};

export const getPublicUser = async (userId: string) => {
  return await db.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });
};

const fullUserSelect = {
  ...publicUserSelect,
  email: true,
  updatedAt: true,
};

export const getFullUser = async (userId: string) => {
  return await db.user.findUnique({
    where: { id: userId },
    select: fullUserSelect,
  });
};

export const getUserByEmail = async (email: string) => {
  return await db.user.findUnique({
    where: { email },
    select: fullUserSelect,
  });
};
