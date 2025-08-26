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

interface Props {
  appId: string;
}

export const AppDetails: React.FC<Props> = ({ appId }) => {
  const [app] = api.apps.app.get.useSuspenseQuery({ appId });

  const [githubLink] = api.apps.app.githubLink.get.useSuspenseQuery(appId);

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

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-bold">App Details</h2>
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
