import { Card } from '../ui/card';
import { Users, TrendingUp } from 'lucide-react';
import { Separator } from '../ui/separator';
import { OwnerEchoApp } from '@/lib/types/apps';

interface OwnerFreeTierTopUsersCardProps {
  app: OwnerEchoApp;
}

export function OwnerFreeTierTopUsersCard({
  app,
}: OwnerFreeTierTopUsersCardProps) {
  // Sort users by amount spent in descending order and take top 10
  const topUsers =
    app.stats?.globalUserSpendStatistics
      ?.sort((a, b) => b.amountSpent - a.amountSpent)
      ?.slice(0, 10) || [];

  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  return (
    <Card className="p-6 hover:border-secondary relative shadow-secondary shadow-[0_0_8px] transition-all duration-300 bg-background/80 backdrop-blur-sm border-border/50 h-80 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white">
            <Users className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-bold">Top Free Tier Users</h3>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <TrendingUp className="h-4 w-4" />
          <span>{topUsers.length} users</span>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="flex-1 overflow-y-auto">
        {topUsers.length > 0 ? (
          <div className="space-y-2">
            {topUsers.map((user, index) => (
              <div
                key={user.userId}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{user.userId}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>Spent: {formatCurrency(user.amountSpent)}</span>
                      {user.amountLeft !== null && (
                        <>
                          <span>•</span>
                          <span>
                            Remaining: {formatCurrency(user.amountLeft)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">
                    {formatCurrency(user.amountSpent)}
                  </div>
                  {user.spendLimit && (
                    <div className="text-xs text-muted-foreground">
                      of {formatCurrency(user.spendLimit)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              No free tier users have spent any credits yet.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
