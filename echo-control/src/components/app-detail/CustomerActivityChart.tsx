import { Card } from '@/components/ui/card';
import { CommitChart } from '../activity-chart/chart';
import { CustomerEchoApp, OwnerEchoApp } from '@/lib/apps/types';
import { transformActivityData } from './AppDetailShared';

// Activity Chart Card
interface CustomerActivityChartProps {
  app: CustomerEchoApp | OwnerEchoApp;
  title?: string;
  isGlobalView?: boolean;
}

export function CustomerActivityChart({
  app,
  title = 'Activity',
  isGlobalView = false,
}: CustomerActivityChartProps) {
  const activityData = isGlobalView
    ? app.stats.globalActivityData
    : app.stats.personalActivityData;
  return (
    <div className="flex flex-col">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <Card className="flex-1 p-6 hover:border-secondary relative shadow-secondary shadow-[0_0_8px] transition-all duration-300 bg-background/80 backdrop-blur-sm border-border/50">
        <div className="h-64">
          <CommitChart
            data={{
              data: transformActivityData(
                activityData.map(activity => activity.totalTokens) || []
              ),
              isLoading: false,
            }}
            numPoints={app.stats?.globalActivityData?.length || 0}
            timeWindowOption={{ value: '30d' }}
            startDate={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
            endDate={new Date()}
            chartHeight={240}
            shouldAnimate={true}
          />
        </div>
      </Card>
    </div>
  );
}
