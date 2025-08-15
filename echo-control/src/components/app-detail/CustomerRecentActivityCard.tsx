import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CustomerEchoApp, SerializedTransaction } from '@/lib/apps/types';
import { formatCurrency } from '@/lib/balance';

interface CustomerRecentActivityCardProps {
  app: CustomerEchoApp;
  title?: string;
  isGlobalView?: boolean;
}

export function CustomerRecentActivityCard({
  app,
  title = 'Recent Activity',
}: CustomerRecentActivityCardProps) {
  const transactions: SerializedTransaction[] =
    app.stats?.personalRecentTransactions || [];

  return (
    <Card className="p-6 hover:border-primary relative shadow-primary shadow-[0_0_8px] transition-all duration-300 bg-background/80 backdrop-blur-xs border-border/50 h-80 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>

      <Separator className="my-4" />

      <div className="space-y-3 flex-1 overflow-auto">
        {transactions.length > 0 ? (
          <>
            {transactions.slice(0, 4).map(transaction => (
              <div
                key={transaction.id}
                className="flex justify-between items-start text-sm"
              >
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {formatCurrency(transaction.totalCost)}
                  </p>
                </div>
              </div>
            ))}
            {transactions.length > 4 && (
              <p className="text-xs text-muted-foreground">
                +{transactions.length - 4} more transactions
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-8 flex-1 flex items-center justify-center">
            <div>
              <p className="text-muted-foreground text-sm">No activity yet</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
