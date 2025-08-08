import { cn } from '@/lib/utils';
import { Button, ButtonProps } from './button';

const PADDING = 2;
const BORDER_RADIUS = 6;

export const TurboButton: React.FC<Omit<ButtonProps, 'variant'>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <Button
      variant="unstyled"
      className={cn(
        'p-0 overflow-hidden border border-primary/70 group shadow-[0_0_6px_color-mix(in_oklab,var(--primary)_80%,transparent)]',
        'hover:shadow-[0_0_8px_color-mix(in_oklab,var(--primary)_80%,transparent)] transition-all',
        className
      )}
      style={{
        borderRadius: `${BORDER_RADIUS}px`,
      }}
      {...props}
    >
      <div
        className={cn(
          'size-full',
          'bg-gradient-to-r from-primary/60 via-primary/40 to-primary/60',
          'shadow-md shadow-primary'
        )}
        style={{
          padding: `${PADDING}px`,
          animation: 'shimmer 1s infinite',
        }}
      >
        <div
          className="size-full bg-muted/70 flex items-center justify-center font-bold text-primary transition-colors group-hover:bg-card/60 gap-1"
          style={{
            borderRadius: `${BORDER_RADIUS - PADDING}px`,
          }}
        >
          {children}
        </div>
      </div>
    </Button>
  );
};
