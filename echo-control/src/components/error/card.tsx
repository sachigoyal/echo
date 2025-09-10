import { AlertCircle } from 'lucide-react';

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';

import type { ErrorComponentProps } from './types';

export const ErrorCard: React.FC<ErrorComponentProps> = ({
  title = 'An Error Has Occurred!',
  description = "We've reported this to our team and will investigate it shortly.",
  errorProps,
  Icon = AlertCircle,
}) => {
  return (
    <Card className="gap-4 flex flex-col">
      <CardHeader className="flex flex-col items-center text-center">
        <Icon className="size-12 text-primary mb-4" />
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button onClick={errorProps.reset} className="w-full">
          Reset
        </Button>
      </CardFooter>
    </Card>
  );
};
