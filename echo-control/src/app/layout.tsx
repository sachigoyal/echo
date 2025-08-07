import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from 'next-themes';
import Header from '@/components/header/header';
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
    <ClerkProvider>
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
    </ClerkProvider>
  );
}
