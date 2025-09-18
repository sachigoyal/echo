import { ChartAreaLinear } from '@/components/overview-chart/LinearChart';

// Individual chart config (discriminated union)
export type ChartItem = {
  id: string;
  type: 'area-linear';
  title: string;
  description?: string;
  // Props forwarded to ChartAreaLinear
  props: React.ComponentProps<typeof ChartAreaLinear>;
  // Card styling
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};
