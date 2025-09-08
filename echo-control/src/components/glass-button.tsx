'use client';

import { cn } from '@/lib/utils';
import { ReactNode, useState, forwardRef } from 'react';

interface GlassButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  glowColor?: string;
  fromColor?: string;
  toColor?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  effectGrow?: number;
  effectGrowHover?: number;
  theme?: 'light' | 'dark';
}

export const GlassButton = forwardRef<HTMLDivElement, GlassButtonProps>(
  (
    {
      children,
      onClick,
      className,
      glowColor: glowColorProp = '#cd0202',
      fromColor: fromColorProp = '#cd0202',
      toColor: toColorProp = '#cd0202',
      disabled,
      variant,
      effectGrow = 3,
      effectGrowHover = 6,
      theme = 'dark',
      ...props
    },
    ref
  ) => {
    const colors = {
      primary: {
        fromColor: theme === 'light' ? '#cd0202' : '#cd0202',
        toColor: theme === 'light' ? '#cd0202' : '#cd0202',
        glowColor: theme === 'light' ? '#cd0202' : '#cd0202',
      },
      secondary: {
        glowColor: theme === 'light' ? '#009DC8' : '#0199AE',
        fromColor: theme === 'light' ? '#009DC8' : '#0199AE',
        toColor: theme === 'light' ? '#009DC8' : '#0199AE',
      },
    };

    const { fromColor, toColor, glowColor } = variant
      ? colors[variant]
      : {
          fromColor: fromColorProp,
          toColor: toColorProp,
          glowColor: glowColorProp,
        };

    const [isHovered, setIsHovered] = useState(false);

    return (
      <div
        ref={ref}
        onClick={disabled ? undefined : onClick}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => !disabled && setIsHovered(false)}
        className={cn(
          'glass-border-button bg-white/10 rounded-xl relative h-12 shadow-xs shadow-black/5 tracking-wide',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "glass-border absolute overflow-hidden rounded-xl z-0 after:content-[''] after:w-full after:h-full after:absolute after:left-0 after:top-0 after:rounded-xl after:border-[0.5px] after:border-white/20 transition-all duration-300"
          )}
          style={{
            left:
              isHovered && !disabled
                ? `-${effectGrowHover}px`
                : `-${effectGrow}px`,
            top:
              isHovered && !disabled
                ? `-${effectGrowHover}px`
                : `-${effectGrow}px`,
            height:
              isHovered && !disabled
                ? `calc(100% + ${effectGrowHover * 2}px)`
                : `calc(100% + ${effectGrow * 2}px)`,
            width:
              isHovered && !disabled
                ? `calc(100% + ${effectGrowHover * 2}px)`
                : `calc(100% + ${effectGrow * 2}px)`,
          }}
        >
          <div
            className="animate-spin [animation-duration:5s] blur-sm absolute left-[-42px] top-[-90px] aspect-square h-auto w-[150%]"
            style={{
              background: `conic-gradient(from 90deg at 50% 50%, ${glowColor}1f 0, ${glowColor}1f 10%, ${glowColor} 20%, ${glowColor}1f 30%, ${glowColor}1f 60%, ${glowColor} 70%, ${glowColor}1f 80%, ${glowColor}1f 100%)`,
            }}
          />
        </div>
        <div
          className="z-10 inline-flex h-full w-full items-center justify-center rounded-xl py-1 px-8 backdrop-blur-2xl text-gray-50"
          style={{
            background: `linear-gradient(to top, ${fromColor}e6, ${toColor}80)`,
          }}
        >
          <div className="flex items-center justify-center gap-2 transition-transform duration-100 ease-in-out text-gray-50 w-full">
            {children}
          </div>
        </div>
      </div>
    );
  }
);

GlassButton.displayName = 'GlassButton';
