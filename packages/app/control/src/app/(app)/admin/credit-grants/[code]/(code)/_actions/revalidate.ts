'use server';

import { revalidatePath } from 'next/cache';

export const revalidateCodePage = async (code: string) => {
  return revalidatePath(`/admin/credit-grants/${code}`);
};
