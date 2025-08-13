import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const dashedBorder = 'border-dashed border-border/80';

export const Hero = () => {
  return (
    <div>
      <div className={cn('h-16 border-x mx-8', dashedBorder)} />
      <div className="flex">
        <div className={cn('w-8 border-y shrink-0', dashedBorder)} />
        <div
          className={cn(
            'flex flex-col items-center justify-center border',
            dashedBorder
          )}
        >
          <h1
            className={cn(
              'text-5xl font-extrabold bg-gradient-to-b from-foreground via-foreground/85 to-foreground/50 bg-clip-text text-transparent w-full text-center p-8 border-b',
              dashedBorder
            )}
          >
            Monetize AI Apps in Minutes
          </h1>
          <p
            className={cn(
              'text-lg text-center w-full p-6 border-b',
              dashedBorder
            )}
          >
            Charge usage-based billing for your product to{' '}
            <strong>start generating revenue risk-free</strong>. You set the
            markup, we handle the rest.
          </p>
          <div className={cn('flex justify-center p-6 gap-2')}>
            <Button size="lg" variant="turbo">
              Create an App
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
        <div className={cn('w-8 border-y shrink-0', dashedBorder)} />
      </div>

      <div className={cn('h-16 border-x mx-8', dashedBorder)} />
    </div>
  );
};
