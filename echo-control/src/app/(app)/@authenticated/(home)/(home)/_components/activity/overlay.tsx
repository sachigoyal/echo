'use client';

import { Button } from '@/components/ui/button';
import { api } from '@/trpc/client';
import { Lock } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';

export const ActivityOverlay: React.FC = () => {
  const [numApps] = api.apps.count.owner.useSuspenseQuery();

  return (
    <AnimatePresence>
      {numApps === 0 && (
        <motion.div
          className="absolute inset-0 bg-card/60 z-50 flex flex-col gap-4 items-center justify-center backdrop-blur-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Lock className="size-16 text-primary" />
          <p className="text-lg font-medium text-center max-w-xs">
            Create your first app to start earning
          </p>
          <Link href="/new">
            <Button variant="turbo">Create App</Button>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
