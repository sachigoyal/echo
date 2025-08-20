import React, { ReactNode } from 'react';

import { Separator } from '@/components/ui/separator';

interface HeadingProps {
  title: string;
  description?: string;
}

export const Heading: React.FC<HeadingProps> = ({ title, description }) => {
  return (
    <>
      <div className="flex flex-col gap-2 max-w-4xl w-full px-2 pb-6 mx-auto text-left">
        <h1 className="text-4xl font-bold">{title}</h1>
        {description && (
          <p className="text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>
      <Separator />
    </>
  );
};

interface BodyProps {
  children: ReactNode;
}

export const Body: React.FC<BodyProps> = ({ children }) => {
  return (
    <div className="flex flex-col gap-4 max-w-4xl w-full mx-auto py-8 px-2">
      {children}
    </div>
  );
};
