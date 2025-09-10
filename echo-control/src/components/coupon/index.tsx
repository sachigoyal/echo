'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Gift } from 'lucide-react';
import { motion } from 'motion/react';

interface CouponProps {
  value?: number;
  className?: string;
}

export const Coupon: React.FC<CouponProps> = ({ value = 5.0, className }) => {
  return (
    <div
      className={cn(
        'relative mx-auto overflow-hidden w-full',
        'bg-gradient-to-br from-primary via-primary/80 to-primary',
        'rounded-2xl',
        'shadow-2xl',
        'after:content-[""] after:absolute after:inset-0 after:rounded-2xl after:shadow-[inset_0_8px_32px_0_rgba(0,0,0,0.18)] after:pointer-events-none',
        className
      )}
    >
      <div className="p-6 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <p className="text-5xl font-bold">${value.toFixed(2)}</p>
          <div className="flex items-center gap-2 h-fit">
            <p className="font-semibold">Free Credits</p>
            <Gift className="size-5" />
          </div>
        </div>
        <p className="text-sm">
          You can use these credits to make LLM requests on
          <br />
          <strong>any Echo app</strong>.
        </p>
      </div>
      <div className="-mx-2 flex items-center justify-center w-[calc(100%+1rem)] py-2">
        <div className="rounded-full size-4 bg-background" />
        <svg className="flex-1 h-[2px]">
          <line
            x1="0"
            y1="0"
            x2="100%"
            y2="0"
            pathLength="100"
            stroke="var(--background)"
            strokeWidth="2"
            strokeDasharray="2 1.5"
          />
        </svg>
        <div className="rounded-full size-4 bg-background" />
      </div>
      <div className="p-4">
        <motion.button
          className="bg-white text-black w-full hover:scale-101 hover:bg-white font-bold h-fit md:h-fit py-3 rounded-xl cursor-pointer shadow-[0_4px_24px_0_rgba(30,64,175,0.18),0_1.5px_6px_0_rgba(0,0,0,0.10)]"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          Claim and Continue
        </motion.button>
      </div>

      {/* Animated shimmer overlay */}
      <style>
        {`
          .animate-coupon-shimmer {
            animation: coupon-shimmer 5s infinite;
          }

          @keyframes coupon-shimmer {
            0% {
              transform: translateX(-400%);
              animation-timing-function: ease-in-out;
            }
            33% {
              transform: translateX(-400%);
              animation-timing-function: ease-in-out;
            }
            66% {
              transform: translateX(400%);
              animation-timing-function: ease-in-out;
            }
            100% {
              transform: translateX(400%);
              animation-timing-function: ease-in-out;
            }
          }
        `}
      </style>
      <div className="absolute top-[-100%] bottom-[-100%] w-[25%] bg-gradient-to-r from-transparent via-white/5 to-transparent animate-coupon-shimmer rounded-3xl rotate-30 pointer-events-none" />
    </div>
  );
};

export default Coupon;
