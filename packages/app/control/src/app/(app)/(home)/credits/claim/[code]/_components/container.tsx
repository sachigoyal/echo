import React from 'react';

import { Logo } from '@/components/ui/logo';
import { Card } from '@/components/ui/card';

interface Props {
  children: React.ReactNode;
}

export const ClaimCreditsContainer: React.FC<Props> = ({ children }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full max-w-xl mx-auto py-8 px-2">
      <div className="flex flex-col items-center gap-4 text-center max-w-2xl">
        <Card className="size-20 p-2 border rounded-xl flex items-center justify-center bg-card">
          <Logo className="size-full" />
        </Card>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Redeem Echo Credits
          </h1>
          <p className="max-w-sm">
            These credits can be used to make LLM requests on
            <br />
            <strong>any Echo app</strong> or to fund a{' '}
            <strong>free tier for your app.</strong>
          </p>
        </div>
      </div>
      {children}
    </div>
  );
};
