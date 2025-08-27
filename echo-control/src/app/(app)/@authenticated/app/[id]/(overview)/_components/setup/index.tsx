'use client';

import { useEffect, useMemo, useState } from 'react';

import { AnimatePresence, motion } from 'motion/react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

import { AppDetails } from './app-details';

import { api } from '@/trpc/client';
import { Connection } from './connection';
import { Accordion } from '@/components/ui/accordion';

interface Props {
  appId: string;
}

export const Setup: React.FC<Props> = ({ appId }) => {
  const [app] = api.apps.app.get.useSuspenseQuery({ appId });
  const [githubLink] = api.apps.app.githubLink.get.useSuspenseQuery(appId);
  const [numTokens] = api.apps.app.getNumTokens.useSuspenseQuery({ appId });

  const appDetailsSteps = useMemo(
    () => [
      app.profilePictureUrl !== null,
      app.description !== null,
      githubLink !== null,
    ],
    [app.profilePictureUrl, app.description, githubLink]
  );

  const connectionSteps = useMemo(() => [numTokens > 0], [numTokens]);

  const steps = [...appDetailsSteps, ...connectionSteps];

  const completedSteps = steps.filter(Boolean).length;
  const allStepsCompleted = completedSteps === steps.length;

  const [isComplete, setIsComplete] = useState(allStepsCompleted);

  const [accordionValue, setAccordionValue] = useState<string[]>([
    ...(!appDetailsSteps.every(Boolean) ? ['app-details'] : []),
    ...(!connectionSteps.every(Boolean) ? ['connection'] : []),
  ]);

  useEffect(() => {
    if (appDetailsSteps.every(Boolean)) {
      setAccordionValue(prev => prev.filter(value => value !== 'app-details'));
    }
  }, [appDetailsSteps]);

  useEffect(() => {
    if (connectionSteps.every(Boolean)) {
      setAccordionValue(prev => prev.filter(value => value !== 'connection'));
    }
  }, [connectionSteps]);

  return (
    <AnimatePresence mode="wait">
      {!isComplete && (
        <motion.div
          initial={{ opacity: 0, height: 0, paddingBottom: 0 }}
          animate={{ opacity: 1, height: 'auto', paddingBottom: 32 }}
          exit={{
            height: 0,
            paddingBottom: 0,
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
                {allStepsCompleted && (
                  <Button
                    variant="turbo"
                    size="sm"
                    className="text-xs"
                    onClick={() => setIsComplete(true)}
                  >
                    Finish Setup
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground">
                Complete the following steps to set up your app
              </p>
            </div>
            <div className="w-1/4 flex items-center gap-2">
              <div className="flex flex-col items-end gap-1 w-full">
                <p className="text-sm text-muted-foreground font-bold shrink-0">
                  {((completedSteps + 1) / (steps.length + 1)) * 100}% Complete
                </p>
                <Progress
                  value={((completedSteps + 1) / (steps.length + 1)) * 100}
                />
              </div>
            </div>
          </div>
          <Accordion
            type="multiple"
            value={accordionValue}
            onValueChange={setAccordionValue}
          >
            <AppDetails appId={appId} />
            <Connection appId={appId} />
          </Accordion>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
