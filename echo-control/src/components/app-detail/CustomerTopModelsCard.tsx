import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CustomerEchoApp, OwnerEchoApp } from '@/lib/apps/types';
import { formatNumber } from './AppDetailShared';
import { formatCost } from './AppDetailShared';

// Top Models Card
interface CustomerTopModelsCardProps {
  app: CustomerEchoApp | OwnerEchoApp;
  title?: string;
  isGlobalView?: boolean;
}

export function CustomerTopModelsCard({
  app,
  title = 'Top Models',
  isGlobalView = false,
}: CustomerTopModelsCardProps) {
  const modelUsage = isGlobalView
    ? app.stats?.globalModelUsage
    : app.stats?.personalModelUsage;

  return (
    <div className="flex flex-col">
      <Card className="flex-1 p-6 hover:border-secondary relative shadow-secondary shadow-[0_0_8px] transition-all duration-300 bg-background/80 backdrop-blur-xs border-border/50 h-80 flex flex-col">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <Separator className="my-4" />
        <CardContent className="p-0 h-full flex-1 overflow-auto">
          {modelUsage && modelUsage.length > 0 ? (
            <div className="space-y-4">
              {modelUsage.slice(0, 5).map((usage, index) => (
                <div
                  key={usage.model}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{usage.model}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(usage.totalTokens)} requests
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      {formatCost(usage.totalModelCost)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(usage.totalTokens)} tokens
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 flex-1 flex items-center justify-center">
              <div>
                <p className="text-muted-foreground text-sm">
                  No model usage yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Usage statistics will appear here
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
