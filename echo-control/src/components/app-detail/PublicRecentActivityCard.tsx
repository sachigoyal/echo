import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PublicEchoApp } from '@/lib/apps/types';
import { formatCost, formatNumber } from './AppDetailShared';

interface PublicRecentActivityCardProps {
  app: PublicEchoApp;
  title?: string;
}

export function PublicRecentActivityCard({
  app,
  title = 'Recent Activity',
}: PublicRecentActivityCardProps) {
  // Public apps only show aggregated activity data, not individual transactions
  const activityData = app.stats?.globalActivityData || [];

  console.log(activityData);

  // Get the most recent activity periods
  const recentActivity = activityData
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 4);

  return (
    <Card className="p-6 hover:border-secondary relative shadow-secondary shadow-[0_0_8px] transition-all duration-300 bg-background/80 backdrop-blur-sm border-border/50 h-80 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>

      <Separator className="my-4" />

      <div className="space-y-3 flex-1 overflow-auto">
        {recentActivity.length > 0 ? (
          <>
            {recentActivity.map((activity, index) => (
              <div
                key={`${activity.timestamp}-${index}`}
                className="flex justify-between items-start text-sm"
              >
                <div className="flex-1">
                  <p className="font-medium">
                    {new Date(activity.timestamp).toLocaleDateString()} Activity
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(activity.totalInputTokens)} input /{' '}
                    {formatNumber(activity.totalOutputTokens)} output
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {formatCost(activity.totalCost)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(activity.totalTokens)} total tokens
                  </p>
                </div>
              </div>
            ))}
            {activityData.length > 4 && (
              <p className="text-xs text-muted-foreground">
                +{activityData.length - 4} more activity periods
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-8 flex-1 flex items-center justify-center">
            <div>
              <p className="text-muted-foreground text-sm">No activity yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                This app hasn&apos;t recorded any usage yet
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
