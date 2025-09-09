import React from 'react';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';

interface CouponProps {
  value?: number;
  className?: string;
}

export const Coupon: React.FC<CouponProps> = ({ value = 150.0, className }) => {
  return (
    <div
      className={cn(
        'relative w-80 h-96 mx-auto',
        'bg-gradient-to-tr from-primary via-primary/80 to-primary',
        'rounded-3xl overflow-hidden shadow-2xl',
        'border border-white/20',
        className
      )}
    >
      {/* Main content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-white p-8">
        {/* Title */}
        <h1 className="text-4xl font-bold mb-8 text-center tracking-wide">
          Echo credits
        </h1>

        {/* Logo/Cube with hexagonal background */}
        <div className="relative mb-8">
          {/* Hexagonal rings background */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 border-2 border-white/20 rounded-lg rotate-45 transform"></div>
            <div className="absolute w-28 h-28 border-2 border-white/15 rounded-lg rotate-45 transform"></div>
            <div className="absolute w-24 h-24 border-2 border-white/10 rounded-lg rotate-45 transform"></div>
            <div className="absolute w-20 h-20 border-2 border-white/10 rounded-lg rotate-45 transform"></div>
          </div>

          {/* Logo */}
          <div className="relative z-10 flex items-center justify-center w-32 h-32">
            <Logo className="w-12 h-12" priority />
          </div>
        </div>

        {/* Value section */}
        <div className="text-center">
          <p className="text-lg font-medium mb-2 opacity-90">Value of</p>
          <p className="text-5xl font-bold tracking-wider">
            ${value.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Subtle overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/5 pointer-events-none" />
    </div>
  );
};

export default Coupon;
