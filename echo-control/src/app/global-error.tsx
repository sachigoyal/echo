'use client';

import { ErrorCard } from '@/components/error/card';
import { NextErrorProps } from '@/types/next-error';

export default function GlobalError(props: NextErrorProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-card h-screen w-screen flex flex-col items-center justify-center">
        <ErrorCard
          title="An Error Has Occurred!"
          description="We've reported this to our team and will investigate it shortly."
          errorProps={props}
        />
      </body>
    </html>
  );
}
