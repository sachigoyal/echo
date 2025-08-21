import { Check, DollarSign, LucideIcon, Pen } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { AppDetails } from './app-details';
import { RecipientDetails } from './recipient-details';

import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { api } from '@/trpc/server';
import { revalidatePath } from 'next/cache';

interface Props {
  appId: string;
  description: string | null;
  profilePictureUrl: string | null;
}

export const Setup: React.FC<Props> = ({
  appId,
  description,
  profilePictureUrl,
}) => {
  const steps = [
    {
      title: 'App Details',
      description: 'What your app does',
      Icon: Pen,
      isComplete: description !== null && profilePictureUrl !== null,
      component: (
        <AppDetails
          updateApp={async data => {
            'use server';
            try {
              await api.apps.owner.update({
                appId,
                ...data,
              });
              revalidatePath(`/app/${appId}`);
              return true;
            } catch (error) {
              console.error(error);
              return false;
            }
          }}
        />
      ),
      className: 'basis-4/5 md:basis-2/5',
    },
    {
      title: 'Payouts',
      description: 'Where the money goes',
      Icon: DollarSign,
      isComplete: false,
      component: <RecipientDetails />,
      className: 'basis-4/5 md:basis-2/5',
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center gap-4">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Let&apos;s Get Started</h1>
          <p className="text-muted-foreground">
            Fill out your app&apos;s details
          </p>
        </div>
        <div className="w-1/3 flex items-center gap-2">
          <p className="text-sm text-muted-foreground font-bold shrink-0">
            {steps.filter(step => step.isComplete).length} / {steps.length}
          </p>
          <Progress
            value={
              (steps.filter(step => step.isComplete).length / steps.length) *
              100
            }
          />
        </div>
      </div>
      <Carousel startIndex={steps.findIndex(step => step.isComplete) ?? 0}>
        <CarouselContent className="pb-1">
          {steps.map(step => (
            <CarouselItem
              key={step.title}
              className={cn('h-full', step.className)}
            >
              <StepCard {...step} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
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
