'use client';

import React from 'react';

import Image from 'next/image';

import { Gift } from 'lucide-react';

import { MultiStateCouponButton, STATES } from './multi-state-button';
import { Marquee } from '../magicui/marquee';

import { cn } from '@/lib/utils';

// Base container component
const CouponContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode;
  }
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative mx-auto overflow-hidden w-full',
      'bg-gradient-to-br from-primary via-primary/80 to-primary',
      'rounded-2xl',
      'after:content-[""] after:absolute after:inset-0 after:rounded-2xl after:shadow-[inset_0_8px_32px_0_rgba(0,0,0,0.18)] after:pointer-events-none',
      className
    )}
    {...props}
  >
    {children}
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
    <div
      ref={ref}
      className={cn(
        'absolute top-[-100%] bottom-[-100%] w-[25%] bg-gradient-to-r from-transparent via-white/5 to-transparent animate-coupon-shimmer rounded-3xl rotate-30 pointer-events-none',
        className
      )}
      {...props}
    />
  </div>
));
CouponContainer.displayName = 'CouponContainer';

// Header component
const CouponHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('p-6 flex flex-col gap-2 text-white', className)}
    {...props}
  />
));
CouponHeader.displayName = 'CouponHeader';

const CouponTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex gap-2 justify-between items-center', className)}
    {...props}
  />
));
CouponTitle.displayName = 'CouponTitle';

const CouponDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm text-white', className)} {...props}>
    {children ?? (
      <p className="text-sm">
        You can use these credits to
        <br />
        make LLM requests on <strong>any Echo app</strong> or to <br />
        fund a <strong>free tier for your app</strong>.
      </p>
    )}
  </div>
));
CouponDescription.displayName = 'CouponDescription';

// Value display component
const CouponValue = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & { value: number }
>(({ className, value, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-4xl md:text-5xl font-bold text-white', className)}
    {...props}
  >
    ${value.toFixed(2)}
  </p>
));
CouponValue.displayName = 'CouponValue';

// Label component
const CouponLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center gap-2 h-fit', className)}
    {...props}
  >
    <CouponLabelText />
    <CouponLabelIcon />
  </div>
));
CouponLabel.displayName = 'CouponLabel';

const CouponLabelText = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('font-semibold text-white', className)} {...props}>
    Free Credits
  </p>
));
CouponLabelText.displayName = 'CouponLabelText';

const CouponLabelIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props}>
    <Gift className="size-5" />
  </div>
));
CouponLabelIcon.displayName = 'CouponLabelIcon';

// Divider component
const CouponDivider = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      '-mx-2 flex items-center justify-center w-[calc(100%+1rem)] py-2 z-10',
      className
    )}
    {...props}
  >
    <div className={cn('rounded-full size-4 bg-background z-20')} />
    <svg className={cn('flex-1 h-[2px] z-20')}>
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
    <div className={cn('rounded-full size-4 bg-background z-20')} />
  </div>
));
CouponDivider.displayName = 'CouponDivider';

// Footer component
const CouponFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('p-4', className)} {...props}>
    {children}
  </div>
));
CouponFooter.displayName = 'CouponFooter';

const CouponClaimButton: React.FC<
  React.HTMLAttributes<HTMLButtonElement> & {
    onClaim: () => void;
    isClaiming: boolean;
    isClaimed: boolean;
    states?: STATES;
  }
> = ({ className, onClaim, isClaiming, isClaimed, states, ...props }) => (
  <MultiStateCouponButton
    className={className}
    onClaim={onClaim}
    state={isClaiming ? 'processing' : isClaimed ? 'success' : 'idle'}
    disabled={isClaiming || isClaimed}
    states={states}
    {...props}
  />
);
CouponClaimButton.displayName = 'CouponClaimButton';

const CouponMarquee = ({ size = 24 }: { size?: number }) => {
  return (
    <Marquee className="">
      {[
        'anthropic',
        'openai',
        'google',
        'meta',
        'nous',
        'xai',
        'microsoft',
        'deepseek',
        'qwen',
      ].map((icon, index) => (
        <Image
          key={icon.toString() + index}
          className={'text-white'}
          src={`/icons/${icon}.svg`}
          alt={`${icon} logo`}
          width={size}
          height={size}
          style={{
            width: size,
            height: size,
            filter: 'invert(1) brightness(2)',
          }}
        />
      ))}
    </Marquee>
  );
};

export {
  CouponContainer,
  CouponHeader,
  CouponValue,
  CouponLabel,
  CouponLabelText,
  CouponLabelIcon,
  CouponDivider,
  CouponFooter,
  CouponTitle,
  CouponDescription,
  CouponClaimButton,
  CouponMarquee,
};
