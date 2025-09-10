import { NextErrorProps } from '@/types/next-error';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Button } from './ui/button';
import { AlertCircle, LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  description: string;
  errorProps: NextErrorProps;
  Icon?: LucideIcon;
}

export const ErrorCard: React.FC<Props> = ({
  title,
  description,
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
