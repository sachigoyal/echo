'use client';

import { useState } from 'react';
import { ChartPanel } from '@/components/overview-chart/ChartPanel';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { api } from '@/trpc/client';

export default function HomePageChart() {
  const [isCumulative, setIsCumulative] = useState(false);
  const { data, isLoading, error } = api.admin.tokens.getHomePageChart.useQuery(
    { isCumulative }
  );

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-gray-50/50 dark:bg-gray-900/20 border-gray-200/60 dark:border-gray-800/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
              <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <Label
                htmlFor="cumulative-toggle"
                className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
              >
                Data View Mode
              </Label>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {isCumulative
                  ? 'Showing cumulative totals over time'
                  : 'Showing individual period values'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isCumulative ? 'Cumulative' : 'Period'}
            </span>
            <Switch
              id="cumulative-toggle"
              checked={isCumulative}
              onCheckedChange={setIsCumulative}
            />
          </div>
        </div>
      </Card>
      <ChartPanel
        charts={data || []}
        isLoading={isLoading}
        error={error}
        grid={{ columns: 2, gap: 'md', responsive: true }}
        className="mb-8"
      />
    </div>
  );
}
