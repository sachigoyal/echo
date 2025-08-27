'use client';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';

import { SiNextdotjs, SiReact } from '@icons-pack/react-simple-icons';

import {
  Tabs,
  TabsTrigger,
  TabsList,
  TabsContent,
  TabsContents,
} from '@/components/ui/shadcn-io/tabs';

import { Card } from '@/components/ui/card';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { ReactStep1, ReactStep2 } from './frameworks/react';
import { NextStep1, NextStep2 } from './frameworks/next';

import { api } from '@/trpc/client';
import { Check, Lock, MessageSquare } from 'lucide-react';

interface Props {
  appId: string;
}

export const GenerateText: React.FC<Props> = ({ appId }) => {
  const [shouldRefetch, setShouldRefetch] = useState(true);

  const [numTokens] = api.apps.app.getNumTokens.useSuspenseQuery({ appId });
  const [numTransactions] = api.apps.app.transactions.count.useSuspenseQuery(
    { appId },
    {
      refetchInterval: shouldRefetch ? 2500 : undefined,
    }
  );

  useEffect(() => {
    setShouldRefetch(numTransactions === 0);
  }, [numTransactions]);

  return (
    <AccordionItem value="generate-text" className="border-none">
      <AccordionTrigger
        className="text-lg font-semibold pt-0"
        disabled={numTokens === 0}
      >
        <div className="flex items-center gap-2">
          {numTokens === 0 ? (
            <Lock className="size-4" />
          ) : numTransactions > 0 ? (
            <Check className="size-4 text-primary" />
          ) : (
            <MessageSquare className="size-4" />
          )}
          Make an LLM Request
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-0">
        <Tabs className="flex flex-col gap-2" defaultValue="next">
          <TabsList className="rounded-lg">
            <TabsTrigger value="next" className="px-8 gap-2 rounded-lg">
              <SiNextdotjs className="size-4" />
              Next.js
            </TabsTrigger>
            <TabsTrigger value="react" className="px-8 gap-2 rounded-lg">
              <SiReact className="size-4" />
              React
            </TabsTrigger>
          </TabsList>
          <TabsContents>
            <TabsContent value="next" className="gap-2 flex flex-col">
              <Card className="flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x">
                <NextStep1 />
                <NextStep2 />
              </Card>
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
            </TabsContent>
            <TabsContent value="react" className="gap-2 flex flex-col">
              <Card className="flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x">
                <ReactStep1 />
                <ReactStep2 />
              </Card>
              <p className="text-sm text-muted-foreground">
                For more detailed instructions, see our{' '}
                <Link
                  href="/docs/getting-started/react"
                  className="text-primary underline font-medium"
                  target="_blank"
                >
                  React docs
                </Link>
              </p>
            </TabsContent>
          </TabsContents>
        </Tabs>
      </AccordionContent>
    </AccordionItem>
  );
};
