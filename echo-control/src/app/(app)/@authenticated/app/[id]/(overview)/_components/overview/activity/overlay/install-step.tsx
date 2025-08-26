import React from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export interface InstallStepProps {
  index: number;
  title: string;
  description: string;
  body: React.ReactNode;
}

export const InstallStep: React.FC<InstallStepProps> = ({
  index,
  title,
  description,
  body,
}) => {
  return (
    <Card className="flex-1 overflow-hidden shadow-none">
      <CardHeader className="flex flex-row gap-4 items-center space-y-0">
        <div className="flex items-center justify-center size-8 font-bold rounded-full bg-primary text-primary-foreground">
          {index + 1}
        </div>
        <div className="flex flex-col">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
};
