'use client';

import { api } from '@/trpc/client';
import { Lock } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface Props {
  appId: string;
}

export const ActivityOverlay: React.FC<Props> = ({ appId }) => {
  const [numTokens] = api.apps.app.getNumTokens.useSuspenseQuery({
    appId,
  });

  return (
    <AnimatePresence>
      {numTokens === 0 && (
        <motion.div
          className="absolute inset-0 bg-card/60 z-50 flex flex-col gap-4 items-center justify-center backdrop-blur-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Lock className="size-16 text-primary" />
          <p className="text-lg font-medium text-center max-w-xs">
            You need to connect to Echo to view your app activity
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
