import { NextResponse } from 'next/server';

import { getFullUser } from '@/services/db/user/get';

import { authRoute } from '@/lib/api/auth-route';

export const GET = authRoute.handler(async (_, context) => {
  const user = await getFullUser(context.ctx.userId);
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }
  return NextResponse.json({
    ...user,
    // old versions of the SDK expect the image field to be called picture
    picture: user.image,
  });
});
