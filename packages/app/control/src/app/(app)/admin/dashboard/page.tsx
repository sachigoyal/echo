import { userOrRedirect } from '@/auth/user-or-redirect';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Code,
  CreditCard,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { TableLayout } from '@/app/(app)/admin/_components';
import TotalTokensChart from '@/app/(app)/admin/_components/chart/TotalTokens';

export default async function AdminDashboard(
  props: PageProps<'/admin/dashboard'>
) {
  await userOrRedirect('/admin/dashboard', props);

  return (
    <TotalTokensChart />
  );
}
