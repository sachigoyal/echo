'use client';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';

import { ChevronsLeftRightEllipsis, Lock } from 'lucide-react';

import { AnimatePresence, motion } from 'framer-motion';

import { Tabs, TabsTrigger, TabsList, TabsContent } from '@/components/ui/tabs';

import { NextStep1, NextStep2, NextStep3 } from './frameworks/next';

import { api } from '@/trpc/client';

interface Props {
  appId: string;
  initialNumTokens: number;
}

export const Overlay: React.FC<Props> = ({ appId, initialNumTokens }) => {
  const [isOpen, setIsOpen] = useState(initialNumTokens === 0);

  const { data: numTokens } = api.apps.app.getNumTokens.useQuery(
    {
      appId,
    },
    {
      initialData: initialNumTokens,
      refetchInterval: isOpen ? 2500 : undefined,
    }
  );

  useEffect(() => {
    setIsOpen(numTokens === 0);
  }, [numTokens]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute inset-0 z-50 bg-card/60 p-4 backdrop-blur-sm flex flex-col gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <ChevronsLeftRightEllipsis className="size-10 text-muted-foreground" />
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold">Connect to Echo</h1>
                <p className="text-sm text-muted-foreground">
                  Authenticate your first user to echo to unlock the activity
                  metrics
                </p>
              </div>
            </div>
            <Lock className="size-10 text-muted-foreground" />
          </div>
          <Tabs defaultValue="next">
            <TabsList>
              <TabsTrigger value="next">Next.js</TabsTrigger>
              <TabsTrigger value="react">React</TabsTrigger>
            </TabsList>
            <TabsContent value="next" className="gap-2 flex flex-col">
              <div className="flex flex-col gap-2">
                <p>
                  For more detailed instructions, see the{' '}
                  <Link href="https://docs.echo.systems/docs/getting-started/nextjs">
                    Echo documentation
                  </Link>
                </p>
              </div>
              <div className="flex flex-col md:flex-row overflow-hidden gap-2">
                <NextStep1 />
                <NextStep2 appId={appId} />
                <NextStep3 />
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
