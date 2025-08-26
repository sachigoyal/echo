'use client';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';

import { ChevronsLeftRightEllipsis, Lock } from 'lucide-react';

import { Tabs, TabsTrigger, TabsList, TabsContent } from '@/components/ui/tabs';

import { NextStep1, NextStep2, NextStep3 } from './frameworks/next';

import { api } from '@/trpc/client';
import { Card } from '@/components/ui/card';

interface Props {
  appId: string;
}

export const Connection: React.FC<Props> = ({ appId }) => {
  const [shouldRefetch, setShouldRefetch] = useState(true);

  const [numTokens] = api.apps.app.getNumTokens.useSuspenseQuery(
    { appId },
    {
      refetchInterval: shouldRefetch ? 2500 : undefined,
    }
  );

  useEffect(() => {
    setShouldRefetch(numTokens === 0);
  }, [numTokens]);

  return (
    <Tabs className="flex flex-col gap-2" defaultValue="next">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold">Connect to Echo</h1>
        <TabsList className="p-0.5 size-fit">
          <TabsTrigger value="next" className="text-xs size-fit p-1">
            Next.js
          </TabsTrigger>
          <TabsTrigger value="react" className="text-xs size-fit p-1">
            React
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="next" className="gap-2 flex flex-col">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            For more detailed instructions, see our{' '}
            <Link
              href="/docs/getting-started/next-js"
              className="text-primary underline font-medium"
              target="_blank"
            >
              Next.js docs
            </Link>
          </p>
        </div>
        <Card className="flex flex-col md:flex-row overflow-hidden gap-2 divide-y md:divide-y-0 md:divide-x">
          <NextStep1 />
          <NextStep2 appId={appId} />
          <NextStep3 />
        </Card>
      </TabsContent>
    </Tabs>
  );
};
