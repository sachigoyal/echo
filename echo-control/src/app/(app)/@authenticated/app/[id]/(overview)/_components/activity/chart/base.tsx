import {
  AreaChart,
  XAxis,
  YAxis,
  Area,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { format, subDays } from 'date-fns';
import { useMemo } from 'react';

interface Props<T> {
  data: T[];
  children: React.ReactNode;
  tooltipContent?: (payload: T) => React.ReactNode;
}

export const BaseChart = <T,>({ data, children, tooltipContent }: Props<T>) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart
        data={data}
        margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
        style={{
          borderBottomLeftRadius: '0.5rem',
          borderBottomRightRadius: '0.5rem',
          overflow: 'hidden',
        }}
      >
        <XAxis
          tickLine={false}
          tick={false}
          axisLine={false}
          interval="preserveEnd"
          height={0}
        />
        <YAxis domain={['0', 'dataMax']} hide={true} />
        {children}
        {tooltipContent && (
          <Tooltip
            content={({ payload }) => {
              console.log(payload);
              if (payload && payload.length) {
                return (
                  <Card className="p-2">
                    {tooltipContent(payload[0].payload as T)}
                  </Card>
                );
              }
              return null;
            }}
            cursor={{
              fill: 'var(--color-neutral-500)',
              opacity: 0.3,
              radius: 4,
            }}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const LoadingChart = () => {
  const simulatedData = useMemo(() => {
    const data: { date: string; value: number }[] = [];
    const baseValue = 100;
    const variance = 50;
    let currentValue = baseValue;

    for (let i = 48; i >= 0; i--) {
      const date = subDays(new Date(), i);
      // Increment can be positive or negative, with some random variation
      const increment = (Math.random() - 0.3) * 2 * variance; // Range: -variance to +variance
      if (i !== 48) {
        currentValue += increment;
      }
      data.push({
        date: format(date, 'MMM dd'),
        value: Math.round(currentValue),
      });
    }

    return data;
  }, []);

  return (
    <div className="animate-pulse">
      <BaseChart data={simulatedData}>
        <Area
          type="monotone"
          dataKey="value"
          stroke="color-mix(in oklab, var(--color-neutral-500) 60%, transparent)"
          strokeWidth={2}
          fill="color-mix(in oklab, var(--color-neutral-500) 40%, transparent)"
          fillOpacity={0.1}
          isAnimationActive={false}
        />
      </BaseChart>
    </div>
  );
};
