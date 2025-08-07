import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';

import { TRPCProvider } from '@/components/providers/TRPCProvider';

import Header from '@/components/header';

import type { Metadata } from 'next';

import './globals.css';

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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased bg-background text-foreground h-dvh overflow-y-auto">
          <TRPCProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              storageKey="echo-theme"
              enableSystem={true}
            >
              <Header />
              <main className="w-screen overflow-x-hidden pt-16 h-full">
                {children}
              </main>
            </ThemeProvider>
          </TRPCProvider>
        </body>
      </html>
    </SessionProvider>
  );
}
