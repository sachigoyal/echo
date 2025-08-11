'use server';

import {
  AuthorizeParams,
  getAuthorizationRedirect,
} from '@/app/(oauth)/_lib/authorize';
import { redirect } from 'next/navigation';

export const authorize = async (params: AuthorizeParams) => {
  const redirect_url = await getAuthorizationRedirect(params);

  if (!redirect_url) {
    return { error: 'unauthorized', error_description: 'Invalid redirect URL' };
  }

  return redirect(redirect_url);
};
