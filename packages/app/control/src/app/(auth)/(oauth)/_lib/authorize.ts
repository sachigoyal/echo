import { z } from 'zod';

import { nanoid } from 'nanoid';

import { auth } from '@/auth';
import { authCodeJwtBodySchema, createAuthCodeJwt } from './code';

export const authorizeParamsSchema = authCodeJwtBodySchema
  .omit({
    code: true,
    exp: true,
    iat: true,
    user_id: true,
  })
  .extend({
    state: z.string().default(nanoid),
  });

export const getAuthorizationRedirect = async ({
  redirect_uri,
  state,
  ...jwtBody
}: z.infer<typeof authorizeParamsSchema>) => {
  const session = await auth();
  const user_id = session?.user?.id;
  if (!user_id) {
    return null;
  }

  const authCodeJwt = await createAuthCodeJwt({
    ...jwtBody,
    redirect_uri,
    user_id,
  });

  /* Return redirect URL for client to use */
  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set('code', authCodeJwt);
  if (state) redirectUrl.searchParams.set('state', state);

  return redirectUrl.toString();
};
