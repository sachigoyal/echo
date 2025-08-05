import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';

import Header from '@/components/header/header';

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
        <body className="antialiased bg-background text-foreground min-h-screen">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            storageKey="echo-theme"
            enableSystem={true}
          >
            <Header />
            <main>{children}</main>
          </ThemeProvider>
        </body>
      </html>
    </SessionProvider>
  );
}
