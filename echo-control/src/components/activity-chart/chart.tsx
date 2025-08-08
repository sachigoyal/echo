import React, { useMemo } from 'react';

import {
  Area,
  AreaChart,
  Customized,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { differenceInDays } from 'date-fns';

import { Suspense } from '../ui/suspense';

const CHART_HEIGHT = 250;
const Y_AXIS_BUFFER = 0;

interface Props {
  data: {
    data: Array<{ index: number; count: number }>;
    isLoading: boolean;
  };
  numPoints: number;
  timeWindowOption: { value: string };
  startDate: Date;
  endDate: Date;
  interactivity?: {
    hoveredIndex: number | null;
    setHoveredIndex: (index: number | null) => void;
  };
  chartHeight?: number;
  shouldAnimate?: boolean;
}

export const CommitChart: React.FC<Props> = ({
  data,
  numPoints,
  timeWindowOption,
  startDate,
  endDate,
  interactivity,
  chartHeight = CHART_HEIGHT,
  shouldAnimate = true,
}) => {
  const upperBound = useMemo(() => {
    const numDays = differenceInDays(endDate, startDate);
    const daysPerBucket = numDays / numPoints;
    return daysPerBucket * 20 + Y_AXIS_BUFFER;
  }, [numPoints, startDate, endDate]);

  return (
    <Suspense
      value={data.data}
      isLoading={data.isLoading}
      component={chartData => {
        // Handle empty data case
        if (!chartData || chartData.length === 0) {
          return <EmptyCommitChart chartHeight={chartHeight} />;
        }

        return (
          <ResponsiveContainer
            width={'100%'}
            height={chartHeight}
            key={timeWindowOption.value}
          >
            <AreaChart
              data={chartData}
              margin={{ top: 6, right: 0, bottom: -24, left: 0 }}
              onMouseMove={
                interactivity
                  ? state => {
                      if (state && state.activeTooltipIndex != null) {
                        interactivity.setHoveredIndex(state.activeTooltipIndex);
                      }
                    }
                  : undefined
              }
              onMouseLeave={
                interactivity
                  ? () => interactivity.setHoveredIndex(null)
                  : undefined
              }
            >
              <defs>
                <linearGradient
                  id="contributionGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--secondary)"
                    stopOpacity={0.9}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--secondary)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--secondary)"
                fill="url(#contributionGradient)"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                activeDot={false}
                isAnimationActive={shouldAnimate}
              />
              {/* Overlay faded rectangle to the right of hovered index using Customized for perfect alignment */}
              {interactivity && interactivity.hoveredIndex !== null && (
                <Customized
                  component={({
                    xAxisMap,
                  }: {
                    xAxisMap?: Record<
                      string,
                      {
                        scale: (value: number) => number;
                        x: number;
                        width: number;
                      }
                    >;
                  }) => {
                    const xAxis = xAxisMap && xAxisMap[0];
                    if (
                      !xAxis ||
                      !xAxis.scale ||
                      !chartData[interactivity.hoveredIndex!]
                    )
                      return null;
                    const x = xAxis.scale(
                      chartData[interactivity.hoveredIndex!].index
                    );
                    const width = xAxis.x + xAxis.width - x;
                    return (
                      <rect
                        x={x}
                        y={0}
                        width={width}
                        height={chartHeight}
                        fill={'rgb(var(--card))'}
                        fillOpacity={0.7}
                        pointerEvents="none"
                      />
                    );
                  }}
                />
              )}
              <XAxis
                dataKey="index"
                tick={false}
                tickLine={false}
                axisLine={false}
                interval={0}
                height={30}
              />
              <YAxis
                hide={true}
                allowDataOverflow={false}
                domain={[0, upperBound]}
              />
              <Tooltip
                content={() => null}
                cursor={false}
                key={timeWindowOption.value}
              />
              {interactivity && interactivity.hoveredIndex !== null && (
                <ReferenceLine
                  x={chartData[interactivity.hoveredIndex].index}
                  stroke="var(--secondary)"
                  strokeDasharray="2 2"
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        );
      }}
      loadingComponent={<LoadingCommitChart chartHeight={chartHeight} />}
    />
  );
};

const EmptyCommitChart: React.FC<{ chartHeight: number }> = ({
  chartHeight,
}) => {
  const emptyData = Array.from({ length: 10 }, (_, i) => ({
    index: i,
    count: 0,
  }));

  return (
    <div className="relative w-full" style={{ height: chartHeight }}>
      <ResponsiveContainer width={'100%'} height={chartHeight}>
        <AreaChart
          data={emptyData}
          margin={{ top: 6, right: 0, bottom: -24, left: 0 }}
        >
          <defs>
            <linearGradient
              id="emptyCommitGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor="rgb(var(--muted-foreground))"
                stopOpacity={0.2}
              />
              <stop
                offset="100%"
                stopColor="rgb(var(--muted-foreground))"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="count"
            stroke="rgb(var(--muted-foreground))"
            fill="url(#emptyCommitGradient)"
            strokeWidth={1}
            strokeOpacity={0.3}
            strokeDasharray="3 3"
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
          />
          <XAxis
            dataKey="index"
            tick={false}
            tickLine={false}
            axisLine={false}
            interval={0}
            height={30}
          />
          <YAxis hide={true} allowDataOverflow={false} domain={[0, 10]} />
        </AreaChart>
      </ResponsiveContainer>

      {/* Centered empty state message */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground text-sm font-medium">
            No activity data available
          </div>
          <div className="text-muted-foreground text-xs mt-1">
            Activity will appear here once data is available
          </div>
        </div>
      </div>
    </div>
  );
};

const LoadingCommitChart: React.FC<{ chartHeight: number }> = ({
  chartHeight,
}) => {
  const simulatedData = Array.from({ length: 15 }, (_, i) => ({
    date: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
    count: Math.floor(Math.random() * 5),
  }));

  const data = useMemo(() => {
    let sum = 0;
    return simulatedData.map(d => ({
      ...d,
      count: (sum += d.count),
    }));
  }, [simulatedData]);

  return (
    <div className="w-full h-full animate-pulse">
      <ResponsiveContainer width={'100%'} height={chartHeight}>
        <AreaChart
          data={data}
          margin={{ top: 6, right: 0, bottom: -24, left: 0 }}
          className="animate-pulse"
        >
          <defs>
            <linearGradient
              id="loadingCommitGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor="rgb(var(--foreground))"
                stopOpacity={0.5}
              />
              <stop
                offset="95%"
                stopColor="rgb(var(--foreground))"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="count"
            stroke="rgb(var(--foreground))"
            fill="url(#loadingCommitGradient)"
            strokeWidth={1.5}
            strokeOpacity={0.5}
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
          />
          <XAxis
            dataKey="date"
            tick={false}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 'dataMax + 10']}
            hide={true}
            scale="sqrt"
            allowDataOverflow={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
