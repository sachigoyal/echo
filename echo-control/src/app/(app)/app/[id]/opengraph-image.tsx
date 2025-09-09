import { dynamicOgImage } from '@/app/_og/dynamic';
import { getApp, getOverallStats } from './_lib/fetch';
import { Users } from '@/app/_og/icons/users';
import { DollarSign } from '@/app/_og/icons/dollar-sign';
import { Brain } from '@/app/_og/icons/brain';

export default async function Image({ params }: PageProps<'/app/[id]'>) {
  const { id } = await params;
  const [app, overallStats] = await Promise.all([
    getApp(id),
    getOverallStats(id),
  ]);

  return dynamicOgImage(
    <div tw="flex flex-col gap-4 justify-between flex-1">
      <div tw="flex justify-between items-start">
        <div tw="flex flex-col">
          <h1 tw="text-8xl font-bold text-black mb-4 mt-0">{app.name}</h1>
          {app.description && (
            <p
              tw="text-3xl text-neutral-600 m-0"
              style={{
                whiteSpace: 'pre-line',
                wordBreak: 'break-word',
                maxWidth: '700px',
              }}
            >
              {app.description}
            </p>
          )}
        </div>
        {app.profilePictureUrl && (
          <img
            src={app.profilePictureUrl}
            alt={app.name}
            height={120}
            width={120}
            tw="rounded-md"
          />
        )}
      </div>
      <div tw="flex text-black text-4xl justify-between">
        <div tw="flex items-center" style={{ color: '#009dc8' }}>
          <DollarSign style={{ height: '48px', width: '48px' }} />
          <span tw="font-medium ml-2">
            {overallStats.totalProfit.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
              notation: 'compact',
            })}{' '}
            Profit
          </span>
        </div>
        <div tw="flex items-center">
          <Brain style={{ height: '48px', width: '48px' }} />
          <span tw="font-medium ml-4">
            {overallStats.numUsers.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
              notation: 'compact',
            })}{' '}
            Users
          </span>
        </div>
        <div tw="flex items-center">
          <Users style={{ height: '48px', width: '48px' }} />
          <span tw="font-medium ml-4">
            {overallStats.transactionCount.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
              notation: 'compact',
            })}{' '}
            Requests
          </span>
        </div>
      </div>
    </div>
  );
}
