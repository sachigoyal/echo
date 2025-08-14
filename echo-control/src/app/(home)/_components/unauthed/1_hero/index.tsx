import { HeroGraphic } from '@/app/(home)/_components/unauthed/1_hero/graphic';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const dashedBorder = 'border-dashed border-border';

export const Hero = () => {
  return (
    <div>
      <div className={cn('h-16 border-x mx-8', dashedBorder)} />
      <div className="flex">
        <div className={cn('w-8 border-y shrink-0', dashedBorder)} />
        <div
          className={cn(
            'flex flex-col items-center justify-center border p-4 md:p-8 gap-4 w-full',
            dashedBorder
          )}
        >
          <div className="flex flex-col gap-2 items-center justify-center">
            <h1 className="text-6xl font-extrabold bg-gradient-to-b from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Echo
            </h1>
            <h1 className={cn('text-3xl font-bold text-center', dashedBorder)}>
              Monetize AI Apps in Minutes
            </h1>
          </div>
          <p className={cn('text-center w-full max-w-sm', dashedBorder)}>
            Charge usage-based billing for your product to{' '}
            <strong>start generating revenue risk-free</strong>. You set the
            markup, we handle the rest.
          </p>
          <div className={cn('flex justify-center gap-2')}>
            <Button size="lg" variant="turbo">
              Create an App
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
          <div className="mt-8">
            <HeroGraphic />
          </div>
        </div>
        <div className={cn('w-8 border-y shrink-0', dashedBorder)} />
      </div>
    </div>
  );
};
