import React, { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';

import {
  AppCard,
  AppCardSkeleton,
} from '@/app/(app)/@authenticated/_components/apps/card';

import { api } from '@/trpc/server';
import {
  Card,
  CardTitle,
  CardHeader,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const Apps = () => {
  return (
    <div className="w-full flex flex-col gap-2 md:gap-3">
      <div className="flex justify-between items-center">
        <h3 className="font-bold">Your Apps</h3>
      </div>
      <ErrorBoundary fallback={<p>There was an error loading your apps</p>}>
        <div className="flex flex-col gap-2">
          <Suspense
            fallback={Array.from({ length: 5 }).map((_, i) => (
              <AppCardSkeleton key={i} />
            ))}
          >
            <AppsGrid />
          </Suspense>
        </div>
      </ErrorBoundary>
    </div>
  );
};

const AppsGrid = async () => {
  const apps = await api.apps.list.owner({});

  if (apps.items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create your First App</CardTitle>
          <CardDescription>
            Get started by creating an app and setting a markup on LLM credits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/new" className="w-full">
            <Button variant="turbo" className="w-full">
              Create App
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return apps.items.map(app => <AppCard key={app.id} {...app} />);
};

const LoadingAppsGrid = () => {
  return Array.from({ length: 5 }).map((_, i) => <AppCardSkeleton key={i} />);
};

export const LoadingAppsSection = () => {
  return (
    <div className="w-full flex flex-col gap-4 md:gap-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold">Your Apps</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <LoadingAppsGrid />
      </div>
    </div>
  );
};
