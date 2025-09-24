'use client';

import * as React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatCurrency } from '@/lib/utils';
import type { OverviewMetricConfig } from '@/services/db/admin/type/overview-metric';

// Metric display types
type MetricDisplayType =
  | 'number'
  | 'currency'
  | 'percentage'
  | 'badge'
  | 'progress'
  | 'trend';

// Grid layout configuration
interface GridConfig {
  columns?: 1 | 2 | 3 | 4 | 6;
  gap?: 'sm' | 'md' | 'lg';
  responsive?: boolean;
}

interface OverviewPanelProps {
  metrics: OverviewMetricConfig[]; // Pre-shaped list of metrics to render
  // Loading and error states controlled by parent
  isLoading?: boolean;
  error?: unknown;
  // Layout configuration
  grid?: GridConfig;
  // Panel title
  title?: string;
  description?: string;
  // Additional styling
  className?: string;
}

export function OverviewPanel({
  metrics,
  isLoading = false,
  error,
  grid = { columns: 4, gap: 'sm', responsive: true },
  title,
  description,
  className,
}: OverviewPanelProps) {
  // Grid class mapping
  const gridClasses = {
    columns: {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
    },
    gap: {
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6',
    },
  };

  // Container: always full width of its parent (no custom width constraints)
  const containerClassName = cn('w-full');

  const gridClassName = cn(
    'grid',
    grid.responsive
      ? gridClasses.columns[grid.columns ?? 3]
      : `grid-cols-${grid.columns ?? 3}`,
    gridClasses.gap[grid.gap ?? 'md']
  );

  if (error) {
    return (
      <div className={containerClassName}>
        <Card className={cn('p-6 border-destructive', className)}>
          {(title ?? description) && (
            <CardHeader className="px-0 pt-0 pb-4">
              {title && (
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              )}
              {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
          )}
          <CardContent className="px-0 pb-0">
            <div className="text-destructive">
              Error loading metrics:{' '}
              {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <Card className={cn('p-6', className)}>
        {(title ?? description) && (
          <CardHeader className="px-0 pt-0 pb-4">
            {title && (
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            )}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}

        <CardContent className="px-0 pb-0">
          <div className={gridClassName}>
            {metrics.map(metric => (
              <MetricCard
                key={metric.id}
                metric={metric}
                isLoading={isLoading}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface MetricCardProps {
  metric: OverviewMetricConfig;
  isLoading: boolean;
}

function MetricCard({ metric, isLoading }: MetricCardProps) {
  const value = metric.value;
  const trendValue = metric.trendValue;

  // Size classes - made more compact
  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };

  if (isLoading) {
    return (
      <Card className={cn(metric.className)}>
        <CardContent className={cn(sizeClasses[metric.size ?? 'sm'])}>
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-12" />
            {metric.description && <Skeleton className="h-2.5 w-20" />}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(metric.className)}>
      <CardContent className={cn(sizeClasses[metric.size ?? 'sm'])}>
        <div className="space-y-0.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              {metric.title}
            </p>
            {metric.format?.showTrend && trendValue !== undefined && (
              <TrendIndicator
                value={trendValue}
                label={metric.format?.trendLabel}
              />
            )}
          </div>

          <div className="flex items-baseline">
            <FormattedValue
              value={value}
              displayType={metric.displayType}
              format={metric.format}
            />
          </div>

          {metric.description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {metric.description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface FormattedValueProps {
  value: unknown;
  displayType: MetricDisplayType;
  format?: OverviewMetricConfig['format'];
}

function FormattedValue({ value, displayType, format }: FormattedValueProps) {
  const formatNumber = (num: number) => {
    const decimals = format?.decimals ?? (displayType === 'currency' ? 2 : 0);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const renderValue = () => {
    if (value == null) return '—';

    switch (displayType) {
      case 'currency':
        return formatCurrency(Number(value));

      case 'percentage':
        return `${formatNumber(Number(value))}%`;

      case 'number':
        return formatNumber(Number(value));

      case 'badge':
        return (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            {String(value as string)}
          </span>
        );

      case 'progress':
        const percentage = Math.min(Math.max(Number(value), 0), 100);
        return (
          <div className="w-full">
            <div className="flex items-center justify-between text-xs">
              <span>{percentage}%</span>
            </div>
            <div className="mt-0.5 h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );

      case 'trend':
        return (
          <div className="flex items-center space-x-1">
            <span>{formatNumber(Number(value))}</span>
            {/* Trend visualization could be added here */}
          </div>
        );

      default:
        return String(value as string);
    }
  };

  return (
    <div className="text-xl font-bold">
      {format?.prefix}
      {renderValue()}
      {format?.suffix}
    </div>
  );
}

interface TrendIndicatorProps {
  value: number;
  label?: string;
}

function TrendIndicator({ value, label }: TrendIndicatorProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const computedDirection = isPositive ? 'up' : isNegative ? 'down' : 'neutral';

  const colorClass = isPositive
    ? 'text-green-600'
    : isNegative
      ? 'text-red-600'
      : 'text-muted-foreground';

  const arrows = {
    up: '↗',
    down: '↘',
    neutral: '→',
  } as const;

  if (value === 0) return null;

  return (
    <div
      className={cn(
        'flex flex-col items-start text-xs font-medium',
        colorClass
      )}
    >
      <div className="flex items-center gap-1.5">
        <span>{arrows[computedDirection]}</span>
        <span>{Math.abs(value).toFixed(1)}%</span>
      </div>
      {label ? (
        <span className="mt-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] leading-none text-muted-foreground">
          {label}
        </span>
      ) : null}
    </div>
  );
}
