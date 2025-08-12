import { Prisma } from '@/generated/prisma';

export const appSelect: Prisma.EchoAppSelect = {
  id: true,
  name: true,
  description: true,
  profilePictureUrl: true,
  bannerImageUrl: true,
  homepageUrl: true,
  isPublic: true,
  createdAt: true,
  updatedAt: true,
};
