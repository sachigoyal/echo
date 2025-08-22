import Link from 'next/link';

import { AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';

interface Props {
  message: React.ReactNode;
  redirectUrl?: string;
}

export const ErrorPage: React.FC<Props> = ({ message, redirectUrl }) => {
  return (
    <Card className="w-full flex flex-col justify-center">
      <CardHeader className="flex-row items-center gap-2">
        <AlertCircle className="size-6 text-red-500 mb-0" />
        <h1 className="text-xl font-bold text-foreground">
          An Error has Occurred
        </h1>
      </CardHeader>
      <CardContent>{message}</CardContent>
      <CardFooter className="flex gap-2">
        {redirectUrl ? (
          <a href={redirectUrl} className="flex-1">
            <Button variant="outline" className="w-full">
              Back to App
            </Button>
          </a>
        ) : (
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full">
              Back to Home
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
};
