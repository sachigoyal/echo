import {
  AreaChart,
  XAxis,
  YAxis,
  Area,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/card';

interface Props<T> {
  data: T[];
  children: React.ReactNode;
}

export const BaseChart = <T,>({ data, children }: Props<T>) => {
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
        <Tooltip
          content={({ payload }) => {
            console.log(payload);
            if (payload && payload.length) {
              return (
                <Card>
                  <p>Total Cost</p>
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
      </AreaChart>
    </ResponsiveContainer>
  );
};
