'use client';

import { BaseChart, ChartData, ChartProps, LoadingChart } from './base-chart';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TabsTriggerProps,
} from './tabs';

interface TabProps<T extends Record<string, number>> {
  trigger: TabsTriggerProps;
  areaProps: ChartProps<T>['areaProps'];
  tooltipRows?: ChartProps<T>['tooltipRows'];
}

interface Props<T extends Record<string, number>> {
  chartData: ChartData<T>[];
  tabs: TabProps<T>[];
}

export const Charts = <T extends Record<string, number>>({
  tabs,
  chartData,
}: Props<T>) => {
  return (
    <Tabs defaultValue={tabs[0].trigger.value}>
      <TabsList>
        {tabs.map(tab => (
          <TabsTrigger key={tab.trigger.label} {...tab.trigger} />
        ))}
      </TabsList>
      {tabs.map(({ trigger, areaProps, tooltipRows }) => (
        <TabsContent key={trigger.label} value={trigger.value}>
          <BaseChart
            data={chartData}
            areaProps={areaProps}
            tooltipRows={tooltipRows}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
};

interface LoadingChartsProps {
  tabs: string[];
}

export const LoadingCharts: React.FC<LoadingChartsProps> = ({ tabs }) => {
  return (
    <div className="animate-pulse">
      <Tabs defaultValue={tabs[0]}>
        <TabsList>
          {tabs.map(tab => (
            <TabsTrigger key={tab} value={tab} label={tab} isLoading={true} />
          ))}
        </TabsList>
        {tabs.map(tab => (
          <TabsContent key={tab} value={tab}>
            <LoadingChart />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
