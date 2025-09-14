"use client";

import { EchoProvider } from '@merit-systems/echo-next-sdk/client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EchoProvider config={{ appId: 'ba00fba2-b6c9-4753-a47d-02838633538e' }}>
      {children}
    </EchoProvider>
  );
}