'use client';

import React, { useEffect, useMemo, useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { api } from '@/trpc/client';
import { Check, Lock, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  SiNextdotjs,
  SiTypescript,
  SiReact,
} from '@icons-pack/react-simple-icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Route } from 'next';

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

  const isConnected = useMemo(() => {
    return numTokens > 0;
  }, [numTokens]);

  useEffect(() => {
    setShouldRefetch(numTransactions === 0);
  }, [numTransactions]);

  return (
    <AccordionItem value="generate-text" className="border-none">
      <AccordionTrigger
        className="text-lg font-semibold pt-0"
        disabled={!isConnected}
      >
        <div
          className={cn(
            'flex items-center gap-2',
            numTransactions > 0 && 'text-primary'
          )}
        >
          {!isConnected ? (
            <Lock className="size-4" />
          ) : numTransactions > 0 ? (
            <Check className="size-4" />
          ) : (
            <MessageSquare className="size-4" />
          )}
          Make an LLM or Image Generation Request
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-0">
        <Card className="overflow-hidden">
          <CardHeader className="border-b space-y-0.5 bg-muted">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="bg-primary rounded-full size-3 animate-ping absolute inset-0" />
                <div className="bg-primary rounded-full size-3" />
              </div>
              <CardTitle className="text-base">Waiting for Requests</CardTitle>
            </div>
            <CardDescription>
              Make your first request from your app.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 p-4">
            <Tabs defaultValue="template">
              <TabsList>
                <TabsTrigger value="template">Template</TabsTrigger>
                <TabsTrigger value="custom">Custom Integration</TabsTrigger>
              </TabsList>
              <TabsContent value="template" className="border rounded-lg p-4">
                <p>
                  If you used a starter template, you have everything you need
                  to make a request.
                </p>
              </TabsContent>
              <TabsContent
                value="custom"
                className="border rounded-lg p-4 flex flex-col gap-2"
              >
                <p>
                  If you built a custom integration, see our docs on how to make
                  a request with the SDK you used.
                </p>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar py-1">
                  {[
                    {
                      href: '/docs/next-sdk/server#ai-providers',
                      icon: <SiNextdotjs className="size-4" />,
                      label: 'Next.js SDK',
                    },
                    {
                      href: '/docs/react-sdk/llm-integration',
                      icon: <SiReact className="size-4" />,
                      label: 'React SDK',
                    },
                    {
                      href: '/docs/typescript-sdk#ai-integration',
                      icon: <SiTypescript className="size-4" />,
                      label: 'TypeScript SDK',
                    },
                  ].map(({ href, icon, label }) => (
                    <Link
                      href={href as Route<'/docs/[sdk]'>}
                      target="_blank"
                      key={href}
                      className="h-fit"
                    >
                      <Button variant="outline" size="sm">
                        {icon} {label}
                      </Button>
                    </Link>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </AccordionContent>
    </AccordionItem>
  );
};
