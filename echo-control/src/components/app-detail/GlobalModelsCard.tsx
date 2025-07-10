import { Zap, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from './AppDetailShared';
import { DetailedEchoApp } from '@/hooks/useEchoAppDetail';

interface GlobalModelsCardProps {
  app: DetailedEchoApp;
  title?: string;
}

export function GlobalModelsCard({
  app,
  title = 'AI Models Used',
}: GlobalModelsCardProps) {
  // Get the top 3 models by token usage for public display
  const topModels = (app.stats?.modelUsage || [])
    .sort((a, b) => (b._sum.totalTokens || 0) - (a._sum.totalTokens || 0))
    .slice(0, 3);

  const totalModelsCount = app.stats?.modelUsage?.length || 0;
  const totalTokens = app.stats?.totalTokens || 0;

  const getModelDisplayName = (model: string): string => {
    // Extract readable model names
    if (model.includes('gpt-4')) return 'GPT-4';
    if (model.includes('gpt-3.5')) return 'GPT-3.5';
    if (model.includes('claude')) return 'Claude';
    if (model.includes('gemini')) return 'Gemini';
    return model.split('-')[0].toUpperCase();
  };

  const getModelColor = (model: string): string => {
    if (model.includes('gpt'))
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (model.includes('claude'))
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (model.includes('gemini'))
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border/50 hover:border-border transition-colors">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="space-y-4">
          {/* Model Stats */}
          <div className="flex items-center gap-4">
            <div>
              <div className="text-2xl font-bold text-foreground">
                {totalModelsCount}
              </div>
              <p className="text-xs text-muted-foreground">Models Used</p>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <BarChart3 className="h-3 w-3" />
              <span className="text-xs">
                {formatNumber(totalTokens)} tokens
              </span>
            </div>
          </div>

          {/* Top Models */}
          {topModels.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">
                Most Used:
              </p>
              <div className="flex flex-wrap gap-2">
                {topModels.map((modelUsage, index) => (
                  <Badge
                    key={modelUsage.model}
                    variant="outline"
                    className={`text-xs border ${getModelColor(modelUsage.model)}`}
                  >
                    #{index + 1} {getModelDisplayName(modelUsage.model)}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground">
                No model usage data available
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
