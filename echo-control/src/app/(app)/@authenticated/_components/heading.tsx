import { Separator } from '@/components/ui/separator';
import React from 'react';

interface Props {
  title: string;
  description?: string;
}

export const Heading = ({ title, description }: Props) => {
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
