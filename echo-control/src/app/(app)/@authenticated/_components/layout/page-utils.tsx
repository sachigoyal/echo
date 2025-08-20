import React, { ReactNode } from 'react';

import { Separator } from '@/components/ui/separator';

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
      <div className="flex items-center justify-between max-w-4xl w-full px-2 pb-4 md:pb-6 mx-auto">
        <div className="flex items-center gap-2">
          {icon}
          <div className="flex flex-col gap-2 w-full text-left">
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
}

export const Body: React.FC<BodyProps> = ({ children }) => {
  return (
    <div className="flex flex-col gap-4 max-w-4xl w-full mx-auto py-8 px-2">
      {children}
    </div>
  );
};
