import { notFound } from 'next/navigation';

import { api } from '@/trpc/server';

export const checkCreditGrant = async (code: string) => {
  try {
    return await api.admin.creditGrants.get({ code });
  } catch {
    return notFound();
  }
};
