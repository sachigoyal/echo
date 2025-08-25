import React, { ReactNode } from 'react';

import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface HeadingProps {
  title: string;
  icon?: ReactNode;
  description?: string;
  actions?: ReactNode;
}

export const Heading: React.FC<HeadingProps> = ({
  icon,
  title,
  description,
  actions,
}) => {
  return (
    <>
      <div className="flex items-center justify-between max-w-6xl w-full px-2 pb-4 md:pb-6 mx-auto">
        <div className="flex items-center gap-4 shrink-0">
          {icon}
          <div className="flex flex-col gap-2 text-left">
            <h1 className="text-4xl font-bold">{title}</h1>
            {description && (
              <p className="text-muted-foreground/80 text-sm">{description}</p>
            )}
          </div>
        </div>
        {actions}
      </div>
      <Separator />
    </>
  );
};

interface BodyProps {
  children: ReactNode;
  className?: string;
}

export const Body: React.FC<BodyProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'flex flex-col gap-8 max-w-6xl w-full mx-auto py-8 px-2',
        className
      )}
    >
      {children}
    </div>
  );
};
