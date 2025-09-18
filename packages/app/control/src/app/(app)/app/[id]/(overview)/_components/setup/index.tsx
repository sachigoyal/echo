'use client';

import { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'motion/react';

import { Accordion } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

import { Connection } from './connection';
import { GenerateText } from './generate-text';

import { useAppConnectionSetup } from '../../../_hooks/use-app-setup';

import { api } from '@/trpc/client';

import { cn } from '@/lib/utils';

interface Props {
  appId: string;
}

export const Setup: React.FC<Props> = ({ appId }) => {
  const {
    isConnected,
    completedConnectionSteps,
    hasMadeTransactions,
    connectionSteps,
    isConnectionComplete,
  } = useAppConnectionSetup(appId);

  const [isOwner] = api.apps.app.isOwner.useSuspenseQuery(appId);

  const [isComplete, setIsComplete] = useState(isConnectionComplete);

  const [accordionValue, setAccordionValue] = useState<string>(
    !isConnected
      ? 'connection'
      : !hasMadeTransactions
        ? 'generate-text'
        : 'connection'
  );

  useEffect(() => {
    let nextAccordionValue = '';

    if (!isConnected) {
      nextAccordionValue = 'connection';
    } else if (!hasMadeTransactions) {
      nextAccordionValue = 'generate-text';
    }

    setAccordionValue(prev =>
      prev === nextAccordionValue ? prev : nextAccordionValue
    );
  }, [isConnected, hasMadeTransactions]);

  return (
    <AnimatePresence mode="wait">
      {!isComplete && isOwner && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{
            height: 0,
            opacity: 0,
            transition: {
              opacity: { delay: 0.1, duration: 0.2 },
              height: { duration: 0.2 },
            },
          }}
          layout
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{ overflow: 'hidden' }}
          className="flex flex-col gap-4 h-full"
        >
          <div className="flex justify-between items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold">Set Up Your App</h1>
              </div>
              <p className="text-muted-foreground">
                Complete the following steps to set up your app
              </p>
            </div>
            <div className="w-1/4 flex items-center gap-2">
              <div className="flex flex-col items-end gap-1 w-full">
                <p className="text-sm text-muted-foreground font-bold shrink-0">
                  {(
                    ((completedConnectionSteps.length + 1) /
                      (connectionSteps.length + 1)) *
                    100
                  ).toFixed(0)}
                  % Complete
                </p>
                <Progress
                  value={
                    ((completedConnectionSteps.length + 1) /
                      (connectionSteps.length + 1)) *
                    100
                  }
                />
              </div>
            </div>
          </div>
          <Accordion
            type="single"
            collapsible
            value={accordionValue}
            onValueChange={setAccordionValue}
          >
            <Connection appId={appId} />
            <GenerateText appId={appId} />
          </Accordion>
          <motion.div
            initial={{ opacity: 0, marginBottom: 0, height: 32 }}
            animate={{
              height: isConnectionComplete ? 48 : 32,
              opacity: isConnectionComplete ? 1 : 0,
              marginBottom: isConnectionComplete ? 32 : 0,
            }}
            exit={{
              height: 0,
              opacity: 0,
            }}
            className="h-8 mb-8"
          >
            <Button
              variant="turbo"
              className={cn(
                'size-full text-lg font-bold',
                !isConnectionComplete && 'pointer-events-none'
              )}
              onClick={
                isConnectionComplete ? () => setIsComplete(true) : undefined
              }
            >
              Finish Setup
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
