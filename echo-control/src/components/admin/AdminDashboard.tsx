'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserSearch } from './UserSearch';
import { AppSearch } from './AppSearch';
import { CreditMinter } from './CreditMinter';
import {
  UserEarningsTable,
  UserSpendingTable,
} from '@/app/admin/_components';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { User, EchoApp } from '@/generated/prisma';

export function AdminDashboard() {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedApp, setSelectedApp] = useState<EchoApp | null>(null);

  const handleAppClick = (appId: string, appName: string) => {
    router.push(`/admin/apps/${appId}`);
  };

  return (
    <div className="grid gap-6">
      {/* User Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Search and select users to manage their credits and view their apps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserSearch
            selectedUser={selectedUser}
            onUserSelect={setSelectedUser}
          />
        </CardContent>
      </Card>

      {/* App Search Section - Only shown when user is selected */}
      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle>User Apps</CardTitle>
            <CardDescription>
              Apps owned by {selectedUser.email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AppSearch
              userId={selectedUser.id}
              selectedApp={selectedApp}
              onAppSelect={setSelectedApp}
            />
          </CardContent>
        </Card>
      )}

      {/* Credit Minting Section - Only shown when user is selected */}
      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle>Mint Credits</CardTitle>
            <CardDescription>
              Issue credits to {selectedUser.email}
              {selectedApp && ` for app "${selectedApp.name}"`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreditMinter user={selectedUser} selectedApp={selectedApp} />
          </CardContent>
        </Card>
      )}

      {/* User Earnings Section */}
      <UserEarningsTable
        selectedUserId={selectedUser?.id}
        onAppClick={handleAppClick}
      />

      {/* User Spending Section */}
      <UserSpendingTable
        selectedUserId={selectedUser?.id}
        onAppClick={handleAppClick}
      />
    </div>
  );
}
