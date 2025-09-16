import React, { useEffect, useMemo, useState } from 'react';

import { DollarSign, Pen, Image, Check, Globe } from 'lucide-react';

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

import { AnimatedCircularProgressBar } from '@/components/ui/animated-circular-progress-bar';
import { useAppDetailsSetup } from '@/app/(app)/app/[id]/_hooks/use-app-setup';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Visibility } from './visibility';

interface Props {
  appId: string;
}

export const SetupApp: React.FC<Props> = ({ appId }) => {
  const {
    hasGithubLink,
    githubLink,
    hasDescription,
    hasVisibility,
    app,
    hasProfilePicture,
    allStepsCompleted,
  } = useAppDetailsSetup(appId);

  const [isVisible, setIsVisible] = useState(!allStepsCompleted);
  const [isOpen, setIsOpen] = useState(false);

  const steps = useMemo(
    () => [
      {
        title: 'Set Payout Details',
        description: 'Where your earnings will be sent',
        Icon: DollarSign,
        isComplete: hasGithubLink,
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
        isComplete: hasDescription,
        component: <Description appId={appId} description={app.description} />,
        className: 'basis-4/5 md:basis-2/5',
      },
      {
        title: 'Add an Icon',
        description: 'Users will see this when they connect to your app',
        Icon: Image,
        isComplete: hasProfilePicture,
        component: (
          <AppIcon appId={appId} profilePictureUrl={app.profilePictureUrl} />
        ),
        className: 'basis-4/5 md:basis-2/5',
      },
      {
        title: 'Set Visibility',
        description: 'Users can discover public apps in the app store',
        Icon: Globe,
        isComplete: hasVisibility,
        component: <Visibility appId={appId} isPublic={app.isPublic} />,
        className: 'basis-4/5 md:basis-2/5',
      },
    ],
    [app, appId, githubLink]
  );

  const [accordionValue, setAccordionValue] = useState<string>(
    steps.find(step => !step.isComplete)?.title ?? ''
  );

  useEffect(() => {
    setAccordionValue(steps.find(step => !step.isComplete)?.title ?? '');
  }, [steps]);

  if (!isVisible) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="primaryOutline"
          className="w-fit hover:bg-accent/50 animate-pulse-shadow"
          style={
            {
              '--pulse-color':
                'color-mix(in oklab, var(--color-primary) 20%, transparent)',
              '--duration': '2s',
              '--pulse-size': '4px',
            } as React.CSSProperties
          }
        >
          {allStepsCompleted ? (
            <Check className="size-4" />
          ) : (
            <AnimatedCircularProgressBar
              gaugePrimaryColor="var(--primary)"
              gaugeSecondaryColor="var(--accent)"
              value={steps.filter(step => step.isComplete).length + 1}
              max={steps.length + 1}
              className="size-6"
              percentageClassName="text-[7px] duration-0"
            />
          )}
          <span className="text-primary">Complete your App Setup</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="p-4 bg-muted border-b">
          <DialogTitle>Complete your App Setup</DialogTitle>
          <DialogDescription>
            Add your app details to finish setting up your app.
          </DialogDescription>
        </DialogHeader>
        <Accordion
          type="single"
          className="flex flex-col gap-2 p-4 flex-1 overflow-y-auto"
          value={accordionValue}
          onValueChange={setAccordionValue}
        >
          {steps.map(step => (
            <AccordionItem
              key={step.title}
              value={step.title}
              className="border rounded-lg p-0 last:border-b"
            >
              <AccordionTrigger className="p-4 items-center">
                <div
                  className={cn(
                    'flex items-center gap-4',
                    step.isComplete && 'text-primary'
                  )}
                >
                  {step.isComplete ? (
                    <Check className="size-6" />
                  ) : (
                    <step.Icon className="size-6" />
                  )}
                  <div className="flex flex-col">
                    <h3 className="text-sm font-semibold">{step.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="border-t p-4">
                {step.component}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <DialogFooter className="p-4 bg-muted border-t items-center gap-4 flex-row">
          <Progress
            value={
              ((steps.filter(step => step.isComplete).length + 1) /
                (steps.length + 1)) *
              100
            }
            className="flex-1"
          />
          <Button
            variant="turbo"
            // disabled={!allStepsCompleted}
            onClick={() => {
              setIsOpen(false);
              setTimeout(() => {
                setIsVisible(false);
              }, 300);
            }}
          >
            Finish Setup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
