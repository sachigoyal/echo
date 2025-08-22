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

import { api } from '@/trpc/server';
import { revalidatePath } from 'next/cache';

import { updateAppSchema, updateGithubLinkSchema } from '@/services/apps/owner';
import { z } from 'zod';
import { SetupContainer } from './setup-container';
import { AppIcon } from './app-icon';

interface Props {
  appId: string;
  description: string | null;
  profilePictureUrl: string | null;
}

export const Setup: React.FC<Props> = async ({
  appId,
  description,
  profilePictureUrl,
}) => {
  const githubLink = await api.apps.owner.getGithubLink({
    appId,
  });

  const updateApp = async (data: z.infer<typeof updateAppSchema>) => {
    'use server';
    await api.apps.owner.update({
      appId,
      ...data,
    });
    revalidatePath(`/app/${appId}`);
  };

  const updateGithubLink = async (
    data: z.infer<typeof updateGithubLinkSchema>
  ) => {
    'use server';
    await api.apps.owner.updateGithubLink({
      appId,
      ...data,
    });
    revalidatePath(`/app/${appId}`);
  };

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
          updateGithubLink={updateGithubLink}
        />
      ),
      className: 'basis-4/5 md:basis-2/5',
    },
    {
      title: 'Describe your App',
      description: 'This will be shown on the Echo dashboard',
      Icon: Pen,
      isComplete: description !== null,
      component: (
        <Description updateApp={updateApp} description={description} />
      ),
      className: 'basis-4/5 md:basis-2/5',
    },
    {
      title: 'Add an Icon',
      description: 'Users will see this when they connect to your app',
      Icon: Image,
      isComplete: profilePictureUrl !== null,
      component: (
        <AppIcon updateApp={updateApp} profilePictureUrl={profilePictureUrl} />
      ),
      className: 'basis-4/5 md:basis-2/5',
    },
  ];

  return (
    <SetupContainer isComplete={steps.every(step => step.isComplete)}>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">Let&apos;s Get Started</h1>
            <p className="text-muted-foreground">
              Fill out your app&apos;s details
            </p>
          </div>
          <div className="w-1/4 flex items-center gap-2">
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
    </SetupContainer>
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
