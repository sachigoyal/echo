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
  DollarSign,
  Activity,
} from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboard(
  props: PageProps<'/admin/dashboard'>
) {
  await userOrRedirect('/admin/dashboard', props);

  return (
    <div className="container mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive overview of platform analytics and management tools
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,350</div>
            <p className="text-xs text-muted-foreground">
              +180 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Apps</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">573</div>
            <p className="text-xs text-muted-foreground">
              +12 new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,234</div>
            <p className="text-xs text-muted-foreground">
              +19% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <CardTitle>User Earnings</CardTitle>
            </div>
            <CardDescription>
              View comprehensive user earnings data and transaction aggregates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/dashboard/user-earnings">
              <Button className="w-full">View User Earnings</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <CardTitle>User Spending</CardTitle>
            </div>
            <CardDescription>
              Analyze user spending patterns and credit usage across the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/dashboard/user-spending">
              <Button className="w-full">View User Spending</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Code className="h-5 w-5 text-blue-600" />
              <CardTitle>App Earnings</CardTitle>
            </div>
            <CardDescription>
              Monitor app performance and revenue generation metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/dashboard/app-earnings">
              <Button className="w-full">View App Earnings</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-purple-600" />
              <CardTitle>Payment History</CardTitle>
            </div>
            <CardDescription>
              Review payment transactions and payout history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/dashboard/payments">
              <Button className="w-full">View Payments</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-orange-600" />
              <CardTitle>Admin Tools</CardTitle>
            </div>
            <CardDescription>
              Search users, manage credits, and view user-specific data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/tools">
              <Button className="w-full">Access Tools</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-indigo-600" />
              <CardTitle>Payouts</CardTitle>
            </div>
            <CardDescription>
              Review pending payouts and completed payout history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/payouts">
              <Button className="w-full">View Payouts</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
