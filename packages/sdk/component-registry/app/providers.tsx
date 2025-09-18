'use client';

import { EchoProvider } from '@merit-systems/echo-next-sdk/client';
import { ThemeProvider } from 'next-themes';
import React, { Suspense } from 'react';

const appId = process.env.NEXT_PUBLIC_ECHO_APP_ID!;

if (!appId) {
  throw new Error('NEXT_PUBLIC_ECHO_APP_ID environment variable is required');
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="echo-theme"
      forcedTheme={undefined}
      enableColorScheme={false}
    >
      <Suspense fallback={null}>
        <EchoProvider config={{ appId: appId }}>{children}</EchoProvider>
      </Suspense>
    </ThemeProvider>
  );
}
