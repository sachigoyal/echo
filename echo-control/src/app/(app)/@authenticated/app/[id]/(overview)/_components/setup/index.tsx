'use client';

import { Check, DollarSign, Image, LucideIcon, Pen } from 'lucide-react';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { Description } from './description';
import { RecipientDetails } from './recipient-details';

import { cn } from '@/lib/utils';

import { api } from '@/trpc/client';

import { AppIcon } from './app-icon';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'motion/react';

interface Props {
  appId: string;
}

export const Setup: React.FC<Props> = ({ appId }) => {
  const [app] = api.apps.public.get.useSuspenseQuery(appId);

  const [githubLink] = api.apps.owner.getGithubLink.useSuspenseQuery({
    appId,
  });

  const steps = [
    {
      title: 'Set Payout Details',
      description: 'Where your earnings will be sent',
      Icon: DollarSign,
      isComplete: githubLink !== null,
      component: (
        <RecipientDetails
          githubLink={
            githubLink
              ? {
                  type: githubLink.githubType,
                  githubUrl: githubLink.githubUrl,
                }
              : null
          }
          appId={appId}
        />
      ),
      className: 'basis-4/5 md:basis-2/5',
    },
    {
      title: 'Describe your App',
      description: 'This will be shown on the Echo dashboard',
      Icon: Pen,
      isComplete: app.description !== null,
      component: <Description appId={appId} description={app.description} />,
      className: 'basis-4/5 md:basis-2/5',
    },
    {
      title: 'Add an Icon',
      description: 'Users will see this when they connect to your app',
      Icon: Image,
      isComplete: app.profilePictureUrl !== null,
      component: (
        <AppIcon appId={appId} profilePictureUrl={app.profilePictureUrl} />
      ),
      className: 'basis-4/5 md:basis-2/5',
    },
  ];

  const completedSteps = steps.filter(step => step.isComplete).length;
  const allStepsCompleted = completedSteps === steps.length;

  const [isComplete, setIsComplete] = useState(allStepsCompleted);

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
              opacity: { delay: 0.1, duration: 0.2 },
              height: { duration: 0.2 },
            },
          }}
          layout
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{ overflow: 'hidden' }}
        >
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center gap-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-bold">Let&apos;s Get Started</h1>
                  {allStepsCompleted && (
                    <Button
                      variant="turbo"
                      size="sm"
                      className="text-xs"
                      onClick={() => setIsComplete(true)}
                    >
                      Finish Setup
                    </Button>
                  )}
                </div>
                <p className="text-muted-foreground">
                  Fill out your app&apos;s details
                </p>
              </div>
              <div className="w-1/4 flex items-center gap-2">
                <div className="flex flex-col items-end gap-1 w-full">
                  <p className="text-sm text-muted-foreground font-bold shrink-0">
                    {completedSteps + 1} / {steps.length + 1} Completed
                  </p>
                  <Progress
                    value={((completedSteps + 1) / (steps.length + 1)) * 100}
                  />
                </div>
              </div>
            </div>
            <Carousel className="w-full" opts={{ loop: true }}>
              <CarouselContent>
                {steps.map(step => (
                  <CarouselItem key={step.title} className={step.className}>
                    <StepCard
                      title={step.title}
                      description={step.description}
                      Icon={step.Icon}
                      isComplete={step.isComplete}
                      component={step.component}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface StepCardProps {
  title: string;
  description: string;
  isComplete: boolean;
  Icon: LucideIcon;
  component: React.ReactNode;
}

const StepCard: React.FC<StepCardProps> = ({
  title,
  description,
  Icon,
  isComplete,
  component,
}: StepCardProps) => {
  return (
    <Card className="flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'size-6 rounded-full shrink-0 bg-primary/10 text-primary flex items-center justify-center',
              isComplete && 'bg-primary text-primary-foreground'
            )}
          >
            {isComplete ? (
              <Check className="size-3" />
            ) : (
              <Icon className="size-3" />
            )}
          </div>
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-4 flex-1">{component}</CardContent>
    </Card>
  );
};
