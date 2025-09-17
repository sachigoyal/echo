import { NextResponse } from 'next/server';
import { authRoute } from '../_lib/auth-route';
import { getFullUser } from '@/services/user/get';

export const GET = authRoute.handler(async (_, context) => {
  const user = await getFullUser(context.ctx.userId);
  return NextResponse.json(user);
});
