'use client';

import React, { useState, useMemo } from 'react';
import { api } from '@/trpc/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronDown,
  ChevronRight,
  CreditCard,
  TrendingDown,
  Users,
  Activity,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Wallet,
  PiggyBank,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { formatNumber } from '@/components/app-detail';

type SortField =
  | 'userName'
  | 'totalSpent'
  | 'totalTransactions'
  | 'userBalance'
  | 'totalSpendPoolUsage'
  | 'totalDirectSpending';
type SortDirection = 'asc' | 'desc';

interface UserSpendingTableProps {
  selectedUserId?: string;
  onAppClick?: (appId: string, appName: string) => void;
}

export function UserSpendingTable({
  selectedUserId,
  onAppClick,
}: UserSpendingTableProps) {
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('totalSpent');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<'all' | 'user' | 'global'>('all');

  // Fetch data based on view mode
  const {
    data: globalData,
    isLoading: globalLoading,
    error: globalError,
  } = api.admin.spending.getAllUsersSpending.useQuery(undefined, {
    enabled: viewMode === 'all' || viewMode === 'global',
  });

  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
  } = api.admin.spending.getUserSpending.useQuery(
    { userId: selectedUserId! },
    { enabled: !!selectedUserId && viewMode === 'user' }
  );

  const isLoading = viewMode === 'user' ? userLoading : globalLoading;
  const error = viewMode === 'user' ? userError : globalError;
  const users =
    viewMode === 'user' && userData
      ? [userData]
      : globalData?.userBreakdowns || [];

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = users.filter(
        user =>
          user.userName?.toLowerCase().includes(term) ||
          user.userEmail.toLowerCase().includes(term) ||
          user.userId.includes(term) ||
          user.appBreakdowns.some(app =>
            app.appName.toLowerCase().includes(term)
          )
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case 'userName':
          aValue = a.userName || a.userEmail;
          bValue = b.userName || b.userEmail;
          break;
        case 'totalSpent':
          aValue = a.totalSpent;
          bValue = b.totalSpent;
          break;
        case 'totalTransactions':
          aValue = a.totalTransactions;
          bValue = b.totalTransactions;
          break;
        case 'userBalance':
          aValue = a.userBalance;
          bValue = b.userBalance;
          break;
        case 'totalSpendPoolUsage':
          aValue = a.totalSpendPoolUsage;
          bValue = b.totalSpendPoolUsage;
          break;
        case 'totalDirectSpending':
          aValue = a.totalDirectSpending;
          bValue = b.totalDirectSpending;
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return sorted;
  }, [users, searchTerm, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleUserExpansion = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const SortButton = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-medium hover:bg-transparent"
    >
      <span className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortDirection === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-50" />
        )}
      </span>
    </Button>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">
            Error Loading Spending Data
          </CardTitle>
          <CardDescription>
            {error.message || 'Failed to load user spending data'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Summary - only show when viewing all users */}
      {viewMode === 'all' && globalData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Global Spending Summary
            </CardTitle>
            <CardDescription>
              Platform-wide spending aggregation across all users and apps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Users</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatNumber(globalData.totalUsers)}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Apps</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatNumber(globalData.totalApps)}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Spent</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(globalData.totalSpent)}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Transactions</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatNumber(globalData.totalTransactions)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Spend Pool Usage
                </span>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(globalData.totalSpendPoolUsage)}
                </p>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Direct Spending
                </span>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(globalData.totalDirectSpending)}
                </p>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Token Usage
                </span>
                <p className="text-lg font-bold text-purple-600">
                  {formatNumber(globalData.totalTokens)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Spending Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                User Spending {selectedUserId ? 'Details' : 'Overview'}
              </CardTitle>
              <CardDescription>
                {selectedUserId
                  ? 'Detailed spending breakdown for selected user'
                  : 'Comprehensive spending data aggregated by user and app'}
              </CardDescription>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('all')}
              >
                All Users
              </Button>
              {selectedUserId && (
                <Button
                  variant={viewMode === 'user' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('user')}
                >
                  Selected User
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users or apps..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredAndSortedUsers.length} user
              {filteredAndSortedUsers.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>
                    <SortButton field="userName">User</SortButton>
                  </TableHead>
                  <TableHead className="text-right">
                    <SortButton field="totalTransactions">
                      Transactions
                    </SortButton>
                  </TableHead>
                  <TableHead className="text-right">
                    <SortButton field="totalSpent">Total Spent</SortButton>
                  </TableHead>
                  <TableHead className="text-right">
                    <SortButton field="userBalance">Balance</SortButton>
                  </TableHead>
                  <TableHead className="text-right">
                    <SortButton field="totalSpendPoolUsage">
                      Pool Usage
                    </SortButton>
                  </TableHead>
                  <TableHead className="text-right">
                    <SortButton field="totalDirectSpending">Direct</SortButton>
                  </TableHead>
                  <TableHead className="text-right">Apps</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedUsers.map(user => (
                  <React.Fragment key={user.userId}>
                    {/* User Row */}
                    <TableRow
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleUserExpansion(user.userId)}
                    >
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          {expandedUsers.has(user.userId) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {user.userName || 'No name'}
                          </div>
                          <div className="text-sm text-muted-foreground truncate max-w-48">
                            {user.userEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(user.totalTransactions)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(user.totalSpent)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${user.userBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {formatCurrency(user.userBalance)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-blue-600">
                        {formatCurrency(user.totalSpendPoolUsage)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(user.totalDirectSpending)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">
                          {user.appBreakdowns.length}
                        </Badge>
                      </TableCell>
                    </TableRow>

                    {/* App Breakdown Rows */}
                    {expandedUsers.has(user.userId) &&
                      user.appBreakdowns.map(app => (
                        <TableRow
                          key={`${user.userId}-${app.appId}`}
                          className="bg-muted/20"
                        >
                          <TableCell></TableCell>
                          <TableCell>
                            <div className="pl-6">
                              <button
                                onClick={() =>
                                  onAppClick?.(app.appId, app.appName)
                                }
                                className="font-medium text-sm hover:text-primary hover:underline cursor-pointer text-left"
                                disabled={!onAppClick}
                              >
                                {app.appName}
                              </button>
                              <div className="text-xs text-muted-foreground">
                                {app.appId}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {formatNumber(app.transactionCount)}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {formatCurrency(app.totalSpent)}
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            -
                          </TableCell>
                          <TableCell className="text-right text-sm text-blue-600">
                            {formatCurrency(app.spendPoolUsage)}
                          </TableCell>
                          <TableCell className="text-right text-sm text-green-600">
                            {formatCurrency(app.directSpending)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="text-xs text-muted-foreground">
                              {formatNumber(app.totalTokens)} tokens
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredAndSortedUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-2">
                No spending data found
              </div>
              <div className="text-sm text-muted-foreground">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'No users have spending data yet'}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
