import {
  Body,
  Heading,
} from '@/app/(app)/@authenticated/_components/layout/page-utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Check, DollarSign, Icon, Link, LucideIcon, Pen } from 'lucide-react';
import { AppDetails } from './app-details';
import { Badge } from '@/components/ui/badge';
import { RecipientDetails } from './recipient-details';

export const Setup = () => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center gap-4">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Let's Get Started</h1>
          <p className="text-muted-foreground">Fill out your app's details</p>
        </div>
        <div className="w-1/3 flex flex-col items-end gap-1">
          <p className="text-sm text-muted-foreground">50% complete</p>
          <Progress value={50} className="-scale-x-100" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StepCard
          title="App Details"
          description="What your app does"
          Icon={Pen}
          isComplete={true}
          component={<AppDetails />}
        />
        <StepCard
          title="Payouts"
          description="Where the money goes"
          Icon={DollarSign}
          isComplete={false}
          component={<RecipientDetails />}
        />
      </div>
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
      <CardHeader>
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'size-8 rounded-full shrink-0 border border-primary/40 flex items-center justify-center',
              isComplete && 'bg-primary text-primary-foreground'
            )}
          >
            {isComplete ? (
              <Check className="size-4" />
            ) : (
              <Icon className="size-4" />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-1">{component}</CardContent>
    </Card>
  );
};
