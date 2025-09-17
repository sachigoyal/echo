'use server';

import { revalidatePath } from 'next/cache';

export const revalidateCodePage = async (code: string) => {
  await revalidatePath(`/admin/codes/${code}`);
};
