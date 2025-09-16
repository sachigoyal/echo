import React, { useMemo } from 'react';

import { DollarSign, Pen, Image, Check } from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

import { RecipientDetails } from './recipient-details';
import { Description } from './description';
import { AppIcon } from './app-icon';

import { api } from '@/trpc/client';
import { AnimatedCircularProgressBar } from '@/components/ui/animated-circular-progress-bar';

interface Props {
  appId: string;
}

export const SetupApp: React.FC<Props> = ({ appId }) => {
  const [app] = api.apps.app.get.useSuspenseQuery({ appId });

  const [githubLink] = api.apps.app.githubLink.get.useSuspenseQuery(appId);

  const steps = useMemo(
    () => [
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
    ],
    [app, appId, githubLink]
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-fit hover:bg-accent/50">
          <span>Complete your App Setup</span>
          <AnimatedCircularProgressBar
            gaugePrimaryColor="var(--primary)"
            gaugeSecondaryColor="var(--accent)"
            value={steps.filter(step => step.isComplete).length + 1}
            max={steps.length + 1}
            className="size-6"
            percentageClassName="text-[7px]"
          />
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 gap-0">
        <DialogHeader className="p-4">
          <DialogTitle>Setup App</DialogTitle>
          <DialogDescription>Setup your app to get started.</DialogDescription>
        </DialogHeader>
        <Accordion
          type="single"
          collapsible
          className="flex flex-col gap-2 p-4"
        >
          {steps.map(step => (
            <AccordionItem
              key={step.title}
              value={step.title}
              className="border rounded-lg p-0 last:border-b"
            >
              <AccordionTrigger className="p-4">
                <div className="flex items-center gap-2">
                  {step.isComplete ? (
                    <Check className="size-4" />
                  ) : (
                    <step.Icon className="size-4" />
                  )}
                  {step.title}
                </div>
              </AccordionTrigger>
              <AccordionContent className="border-t p-4">
                {step.component}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <DialogFooter className="p-4">
          <Button variant="outline">Cancel</Button>
          <Button variant="turbo">Setup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
