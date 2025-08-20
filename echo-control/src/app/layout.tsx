import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { RootProvider } from 'fumadocs-ui/provider';

import { TRPCReactProvider } from '@/trpc/client';

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

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <SessionProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased bg-card">
          <RootProvider>
            <TRPCReactProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                storageKey="echo-theme"
                enableSystem={true}
              >
                <Toaster />
                <main>{children}</main>
              </ThemeProvider>
            </TRPCReactProvider>
          </RootProvider>
        </body>
      </html>
    </SessionProvider>
  );
}
