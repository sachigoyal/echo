import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { RootProvider } from 'fumadocs-ui/provider';

import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

import { TRPCReactProvider } from '@/trpc/client';
import { PostHogProvider } from '@/components/PostHogProvider';

import { Toaster } from '@/components/ui/sonner';

import type { Metadata } from 'next';

import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Echo',
  description: 'Control plane for Echo applications',
  icons: {
    icon: [
      { url: '/logo/dark.svg', media: '(prefers-color-scheme: dark)' },
      { url: '/logo/light.svg', media: '(prefers-color-scheme: light)' },
    ],
    shortcut: '/logo/dark.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased bg-card">
          <RootProvider>
            <SpeedInsights />
            <Analytics />
            <TRPCReactProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                storageKey="echo-theme"
                enableSystem={true}
              >
                <PostHogProvider>
                  <Toaster />
                  <main>{children}</main>
                </PostHogProvider>
              </ThemeProvider>
            </TRPCReactProvider>
          </RootProvider>
        </body>
      </html>
    </SessionProvider>
  );
}
