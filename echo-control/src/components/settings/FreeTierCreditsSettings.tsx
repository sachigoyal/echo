'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface FreeTierCreditsSettingsProps {
  appId: string;
}

interface UserSpending {
  id: string;
  email: string;
  name?: string;
  totalSpent: number;
  spendLimit: number;
  remainingLimit: number;
  lastActivity: string;
}

interface PoolData {
  totalBalance: number;
  defaultSpendLimit: number;
}

export default function FreeTierCreditsSettings({
  appId,
}: FreeTierCreditsSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [depositing, setDepositing] = useState(false);
  const [poolData, setPoolData] = useState<PoolData>({
    totalBalance: 0,
    defaultSpendLimit: 0,
  });
  const [userSpending, setUserSpending] = useState<UserSpending[]>([]);

  // Deposit form state
  const [depositAmount, setDepositAmount] = useState('');

  // Spend limit state
  const [newSpendLimit, setNewSpendLimit] = useState('');
  const [updatingSpendLimit, setUpdatingSpendLimit] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockData = async () => {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockPool: PoolData = {
        totalBalance: 5000.0,
        defaultSpendLimit: 100.0,
      };

      const mockUsers: UserSpending[] = [
        {
          id: '1',
          email: 'john@example.com',
          name: 'John Doe',
          totalSpent: 45.5,
          spendLimit: 100.0,
          remainingLimit: 54.5,
          lastActivity: '2024-01-15T10:30:00Z',
        },
        {
          id: '2',
          email: 'jane@example.com',
          name: 'Jane Smith',
          totalSpent: 89.25,
          spendLimit: 100.0,
          remainingLimit: 10.75,
          lastActivity: '2024-01-14T15:20:00Z',
        },
        {
          id: '3',
          email: 'bob@example.com',
          totalSpent: 12.75,
          spendLimit: 50.0,
          remainingLimit: 37.25,
          lastActivity: '2024-01-13T09:45:00Z',
        },
        {
          id: '4',
          email: 'alice@example.com',
          name: 'Alice Johnson',
          totalSpent: 156.8,
          spendLimit: 200.0,
          remainingLimit: 43.2,
          lastActivity: '2024-01-12T14:10:00Z',
        },
        {
          id: '5',
          email: 'charlie@example.com',
          totalSpent: 0.0,
          spendLimit: 100.0,
          remainingLimit: 100.0,
          lastActivity: '2024-01-10T08:30:00Z',
        },
      ];

      setPoolData(mockPool);
      setUserSpending(mockUsers);
      setNewSpendLimit(mockPool.defaultSpendLimit.toString());
      setLoading(false);
    };

    mockData();
  }, [appId]);

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;

    setDepositing(true);
    try {
      // Simulate deposit process
      await new Promise(resolve => setTimeout(resolve, 1500));

      setPoolData(prev => ({
        ...prev,
        totalBalance: prev.totalBalance + parseFloat(depositAmount),
      }));
      setDepositAmount('');
    } catch (error) {
      console.error('Deposit failed:', error);
    } finally {
      setDepositing(false);
    }
  };

  const handleUpdateSpendLimit = async () => {
    if (!newSpendLimit || parseFloat(newSpendLimit) <= 0) return;

    setUpdatingSpendLimit(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const limitValue = parseFloat(newSpendLimit);
      setPoolData(prev => ({
        ...prev,
        defaultSpendLimit: limitValue,
      }));

      // Update all users with the new default limit (in real app, this might be optional)
      setUserSpending(prev =>
        prev.map(user => ({
          ...user,
          spendLimit: limitValue,
          remainingLimit: limitValue - user.totalSpent,
        }))
      );
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setUpdatingSpendLimit(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Filter and paginate users
  const filteredUsers = userSpending.filter(
    user =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-64"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-48 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Credit Pool Management
        </h3>
        <p className="text-sm text-muted-foreground">
          Manage your shared credit pool, set user spending limits, and monitor
          usage across all users.
        </p>
      </div>

      {/* Pool Balance & Deposit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Pool Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-4">
              {formatCurrency(poolData.totalBalance)}
            </div>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="deposit-amount"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Deposit Amount
                </label>
                <Input
                  id="deposit-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <Button
                onClick={handleDeposit}
                disabled={
                  depositing || !depositAmount || parseFloat(depositAmount) <= 0
                }
                className="w-full"
              >
                {depositing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    Processing...
                  </div>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Deposit Money
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-500" />
              User Spend Limit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-4">
              {formatCurrency(poolData.defaultSpendLimit)}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Current default spending limit per user
            </p>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="spend-limit"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  New Spend Limit
                </label>
                <Input
                  id="spend-limit"
                  type="number"
                  placeholder="Enter new limit"
                  value={newSpendLimit}
                  onChange={e => setNewSpendLimit(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <Button
                onClick={handleUpdateSpendLimit}
                disabled={
                  updatingSpendLimit ||
                  !newSpendLimit ||
                  parseFloat(newSpendLimit) <= 0
                }
                className="w-full"
                variant="outline"
              >
                {updatingSpendLimit ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    Updating...
                  </div>
                ) : (
                  'Update Spend Limit'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Spending Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Spending Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by email or name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">User</th>
                  <th className="text-left p-3 font-medium">Total Spent</th>
                  <th className="text-left p-3 font-medium">Spend Limit</th>
                  <th className="text-left p-3 font-medium">Remaining</th>
                  <th className="text-left p-3 font-medium">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center p-8 text-muted-foreground"
                    >
                      {searchTerm
                        ? 'No users found matching your search.'
                        : 'No users found.'}
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map(user => (
                    <tr key={user.id} className="border-t">
                      <td className="p-3">
                        <div>
                          <div className="font-medium">
                            {user.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">
                          {formatCurrency(user.totalSpent)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">
                          {formatCurrency(user.spendLimit)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div
                          className={`font-medium ${user.remainingLimit < 10 ? 'text-red-600' : 'text-green-600'}`}
                        >
                          {formatCurrency(Math.max(0, user.remainingLimit))}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-muted-foreground">
                          {formatDate(user.lastActivity)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to{' '}
                {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of{' '}
                {filteredUsers.length} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(prev => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
