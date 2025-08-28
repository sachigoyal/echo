import React, { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardTitle,
  CardHeader,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

import {
  AppCard,
  LoadingAppCard,
} from '@/app/(app)/@authenticated/_components/apps/card';

import { api } from '@/trpc/server';

const AppsContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full flex flex-col gap-2 md:gap-3">
      <div className="flex justify-between items-center">
        <h3 className="font-bold">Your Apps</h3>
      </div>
      {children}
    </div>
  );
};

export const Apps = () => {
  return (
    <AppsContainer>
      <ErrorBoundary fallback={<p>There was an error loading your apps</p>}>
        <div className="flex flex-col gap-2">
          <Suspense fallback={<LoadingAppsGrid />}>
            <AppsCards />
          </Suspense>
        </div>
      </ErrorBoundary>
    </AppsContainer>
  );
};

const AppsCards = async () => {
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
  return Array.from({ length: 3 }).map((_, i) => <LoadingAppCard key={i} />);
};

export const LoadingAppsSection = () => {
  return (
    <AppsContainer>
      <LoadingAppsGrid />
    </AppsContainer>
  );
};
