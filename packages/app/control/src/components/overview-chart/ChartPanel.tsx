'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { ChartAreaLinear } from './LinearChart';
import type { ChartItem } from '@/services/db/ops/admin/type/chart';

// Grid layout configuration (mirrors OverviewPanel)
interface GridConfig {
  columns?: 1 | 2 | 3 | 4 | 6;
  gap?: 'sm' | 'md' | 'lg';
  responsive?: boolean;
}

interface ChartPanelProps {
  charts: ChartItem[];
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

export function ChartPanel({
  charts,
  isLoading = false,
  error,
  grid = { columns: 3, gap: 'sm', responsive: true },
  title,
  description,
  className,
}: ChartPanelProps) {
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
  } as const;

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
              Error loading charts:{' '}
              {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <CardContent className="px-0 pb-0">
          <div className={gridClassName}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-84 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
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
            {charts.map(item => (
              <ChartCard key={item.id} item={item} isLoading={isLoading} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ChartCardProps {
  item: ChartItem;
  isLoading: boolean;
}

function ChartCard({ item, isLoading }: ChartCardProps) {
  if (isLoading) {
    return (
      <Card className={cn(item.className)}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full aspect-video" />
        </CardContent>
        <CardFooter>
          <div className="flex w-full items-start gap-2">
            <div className="grid gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </CardFooter>
      </Card>
    );
  }

  return <div className={cn(item.className)}>{renderChart(item)}</div>;
}

function renderChart(item: ChartItem) {
  switch (item.type) {
    case 'area-linear':
      return <ChartAreaLinear {...item.props} />;
    default:
      return (
        <Card>
          <CardHeader>
            <CardTitle>{item.title}</CardTitle>
            {item.description && (
              <CardDescription>{item.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Unsupported chart type
            </div>
          </CardContent>
        </Card>
      );
  }
}
