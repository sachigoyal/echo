'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  children: React.ReactNode;
  isComplete: boolean;
}

export const SetupContainer: React.FC<Props> = ({ children, isComplete }) => {
  return (
    <AnimatePresence mode="wait">
      {!isComplete && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 350 }}
          exit={{
            height: 0,
            opacity: 0,
            transition: {
              opacity: { delay: 2.1, duration: 0.4 },
              height: { delay: 2, duration: 0.5 },
            },
          }}
          layout
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{ overflow: 'hidden' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
