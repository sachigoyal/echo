// the activity for an application should be the number of transactions over the last 7 days

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAppActivity } from '@/lib/echo-apps/activity/activity';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const activity = await getAppActivity(id);

  return NextResponse.json({ activity });
}
