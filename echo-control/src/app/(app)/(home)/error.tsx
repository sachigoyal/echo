'use client';

import { ErrorCard } from '@/components/error-screen';
import { NextErrorProps } from '@/types/next-error';

export default function HomeError(props: NextErrorProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <ErrorCard
        title="An Error Has Occurred!"
        description="We've reported this to our team and will investigate it shortly."
        errorProps={props}
      />
    </div>
  );
}
