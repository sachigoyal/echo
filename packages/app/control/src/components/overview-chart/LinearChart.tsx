'use client';

import { TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

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

// Prefer readable date labels on the X axis
const defaultDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
});

function parseDateLike(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    const numeric = Number(value);
    const ms = numeric > 1_000_000_000_000 ? numeric : numeric * 1000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'string') {
    const d1 = new Date(value);
    if (!Number.isNaN(d1.getTime())) return d1;
    const d2 = new Date(value.replace(' ', 'T'));
    if (!Number.isNaN(d2.getTime())) return d2;
  }
  return null;
}

function formatXAxisTick(value: unknown): string {
  const d = parseDateLike(value);
  return d ? defaultDateFormatter.format(d) : String(value ?? '');
}

interface ChartAreaLinearProps {
  title: string;
  description: string;
  data: Array<Record<string, unknown>>;
  config: ChartConfig;
  xAxisDataKey: string;
  areaDataKey: string;
  xAxisTickFormatter?: (value: unknown) => string;
  yAxisTickFormatter?: (value: unknown) => string;
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
  xAxisTickFormatter = formatXAxisTick,
  yAxisTickFormatter,
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
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={yAxisTickFormatter}
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
