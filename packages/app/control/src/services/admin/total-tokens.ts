import { ChartItem } from '@/services/admin/type/chart';
import { ChartConfig } from '@/components/ui/chart';
import { db } from '@/lib/db';

export interface GetTotalTokensChartInput {
  startDate?: Date;
  endDate?: Date;
  numBuckets?: number; // default 30 (daily buckets over last 30 days)
}

export const getTotalTokensChart = async (
  input?: GetTotalTokensChartInput
): Promise<ChartItem[]> => {
  const startOfUtcDay = (d: Date) =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

  const defaultEndExclusive = new Date(
    startOfUtcDay(new Date()).getTime() + 24 * 60 * 60 * 1000
  );

  const endDate = input?.endDate ?? defaultEndExclusive;
  const startDate =
    input?.startDate ??
    new Date(
      (input?.endDate ? startOfUtcDay(input.endDate) : defaultEndExclusive).getTime() -
        30 * 24 * 60 * 60 * 1000
    );
  const numBuckets = input?.numBuckets ?? 30;

  const transactions = await db.transaction.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      isArchived: false,
    },
    select: {
      createdAt: true,
      transactionMetadata: {
        select: {
          totalTokens: true,
        },
      },
    },
  });

  const totalMs = endDate.getTime() - startDate.getTime();
  const bucketSizeMs = Math.floor(totalMs / numBuckets);

  const buckets = Array.from({ length: numBuckets }, (_, i) => {
    const bucketStart = new Date(startDate.getTime() + i * bucketSizeMs);
    return {
      timestamp: bucketStart,
      tokens: 0,
    };
  });

  for (const t of transactions) {
    const idx = Math.floor((t.createdAt.getTime() - startDate.getTime()) / bucketSizeMs);
    if (idx >= 0 && idx < numBuckets) {
      const amt = Number(t.transactionMetadata?.totalTokens || 0);
      buckets[idx].tokens += amt;
    }
  }

  const data = buckets.map(b => ({
    timestamp: b.timestamp.toISOString().slice(0, 16),
    tokens: Number(b.tokens || 0),
  }));

  const config: ChartConfig = {
    tokens: { label: 'Tokens', color: '#7c3aed' }, // purple
  };

  const chart: ChartItem = {
    id: 'total-tokens-over-time',
    type: 'area-linear',
    title: 'Total Tokens',
    description: 'Total tokens generated across all apps over the last 30 days',
    props: {
      title: 'Total Tokens',
      description: 'Tokens generated per day (last 30 days)',
      data,
      config,
      xAxisDataKey: 'timestamp',
      areaDataKey: 'tokens',
    },
    size: 'md',
  };

  return [chart];
};