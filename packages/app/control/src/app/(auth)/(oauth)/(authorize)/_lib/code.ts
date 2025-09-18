import { z } from 'zod';

import { nanoid } from 'nanoid';

import { SignJWT } from 'jose';

import { env } from '@/env';
import { addSeconds, getUnixTime } from 'date-fns';

const AUTH_CODE_TTL = 300; // 5 minutes
const JWT_SECRET = new TextEncoder().encode(env.OAUTH_CODE_SIGNING_JWT_SECRET);

export const authCodeJwtInputSchema = z.object({
  client_id: z.uuid('client_id must be a valid UUID'),
  user_id: z.uuid('user_id must be a valid UUID'),
  redirect_uri: z.url('redirect_uri must be a valid URL'),
  code_challenge: z
    .string('code_challenge must be a string')
    .min(43, 'code_challenge must be at least 43 characters')
    .max(128, 'code_challenge must be at most 128 characters')
    .regex(/^[A-Za-z0-9_-]+$/, {
      message: 'code_challenge must be base64url encoded',
    }),
  code_challenge_method: z.literal('S256', {
    error: 'Only S256 code challenge method is supported',
  }),
  scope: z.string('missing scope').default('llm:invoke offline_access'),
});

export const createAuthCodeJwt = async (
  payloadInput: z.input<typeof authCodeJwtInputSchema>
) => {
  const input = authCodeJwtInputSchema.parse(payloadInput);
  const authCodeJwt = await new SignJWT({
    ...input,
    code: nanoid(32),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(getUnixTime(addSeconds(new Date(), AUTH_CODE_TTL)))
    .setIssuedAt(getUnixTime(new Date()))
    .sign(JWT_SECRET);

  return authCodeJwt;
};

export const authCodeJwtPayloadSchema = authCodeJwtInputSchema.extend({
  code: z.string(),
  exp: z.number(),
  iat: z.number(),
});
