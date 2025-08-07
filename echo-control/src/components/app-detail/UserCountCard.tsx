import { Users, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatNumber } from './AppDetailShared';
import { EchoApp } from '@/lib/types/apps';

interface UserCountCardProps {
  app: EchoApp;
  title?: string;
}

export function UserCountCard({
  app,
  title = 'Active Users',
}: UserCountCardProps) {
  // For public apps, we estimate users based on transaction count
  // This provides a rough metric while maintaining privacy
  const estimatedUsers = Math.max(
    1,
    Math.floor((app.stats?.globalTotalTransactions || 0) / 10)
  );

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border/50 hover:border-border transition-colors">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-bold text-foreground">
                {formatNumber(estimatedUsers)}
              </span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated based on activity
            </p>
          </div>

          <div className="pt-3 border-t border-border/30">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                Total Requests
              </span>
              <span className="text-xs font-medium text-foreground">
                {formatNumber(app.stats?.globalTotalTransactions || 0)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
