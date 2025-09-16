'use client';

import { TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface ChartAreaLinearProps {
  title: string;
  description: string;
  data: Array<Record<string, any>>;
  config: ChartConfig;
  xAxisDataKey: string;
  areaDataKey: string;
  xAxisTickFormatter?: (value: any) => string;
  footerTrend?: {
    percentage: string;
    direction: 'up' | 'down';
    period: string;
  };
  footerDateRange?: string;
}

export function ChartAreaLinear({
  title,
  description,
  data,
  config,
  xAxisDataKey,
  areaDataKey,
  xAxisTickFormatter = value => value.toString().slice(0, 3),
  footerTrend,
  footerDateRange,
}: ChartAreaLinearProps) {
  const colorVar = `var(--color-${areaDataKey})`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={xAxisDataKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={xAxisTickFormatter}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" hideLabel />}
            />
            <Area
              dataKey={areaDataKey}
              type="linear"
              fill={colorVar}
              fillOpacity={0.4}
              stroke={colorVar}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      {(footerTrend || footerDateRange) && (
        <CardFooter>
          <div className="flex w-full items-start gap-2 text-sm">
            <div className="grid gap-2">
              {footerTrend && (
                <div className="flex items-center gap-2 leading-none font-medium">
                  Trending {footerTrend.direction} by {footerTrend.percentage}{' '}
                  {footerTrend.period}
                  <TrendingUp className="h-4 w-4" />
                </div>
              )}
              {footerDateRange && (
                <div className="text-muted-foreground flex items-center gap-2 leading-none">
                  {footerDateRange}
                </div>
              )}
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
