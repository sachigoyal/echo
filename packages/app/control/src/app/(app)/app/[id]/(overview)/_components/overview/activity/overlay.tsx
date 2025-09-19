'use client';

import { api } from '@/trpc/client';
import { Lock } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface Props {
  appId: string;
}

export const ActivityOverlay: React.FC<Props> = ({ appId }) => {
  const [shouldRefetchTransactions, setShouldRefetchTransactions] =
    useState(true);
  const [shouldRefetchTokens, setShouldRefetchTokens] = useState(true);

  const [isOwner] = api.apps.app.isOwner.useSuspenseQuery(appId);
  const [numTokens] = api.apps.app.getNumTokens.useSuspenseQuery(
    { appId },
    {
      refetchOnWindowFocus: shouldRefetchTokens,
      refetchInterval: shouldRefetchTokens ? 2500 : undefined,
    }
  );
  const [numTransactions] = api.apps.app.transactions.count.useSuspenseQuery(
    {
      appId,
    },
    {
      refetchOnWindowFocus: shouldRefetchTransactions,
      refetchInterval: shouldRefetchTransactions ? 2500 : undefined,
    }
  );

  useEffect(() => {
    setShouldRefetchTransactions(numTransactions === 0);
    setShouldRefetchTokens(numTokens === 0);
  }, [numTransactions, numTokens]);

  return (
    <AnimatePresence>
      {numTransactions === 0 && (
        <motion.div
          className="absolute inset-0 bg-card/60 z-50 flex flex-col gap-4 items-center justify-center backdrop-blur-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Lock className="size-16 text-primary" />
          <p className="text-lg font-medium text-center max-w-xs">
            {isOwner
              ? numTokens === 0
                ? 'Connect to Echo from your app to view your app activity'
                : 'Generate text from your app to view your app activity'
              : 'The owner of this app has not connected to Echo yet'}
            {}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
