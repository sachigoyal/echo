// Metric config returned to frontend OverviewPanel
export type OverviewMetricConfig = {
  id: string;
  title: string;
  description?: string;
  displayType:
    | 'number'
    | 'currency'
    | 'percentage'
    | 'badge'
    | 'progress'
    | 'trend';
  value: number | string;
  trendValue?: number;
  format?: {
    prefix?: string;
    suffix?: string;
    decimals?: number;
    showTrend?: boolean;
    trendLabel?: string;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};
