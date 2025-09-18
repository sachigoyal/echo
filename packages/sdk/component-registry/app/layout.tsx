import { Providers } from '@/app/providers';
import { ThemeToggle } from '@/registry/echo/ui/theme-toggle';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Echo Components',
  description: 'Echo Components Registry',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container max-w-screen-2xl mx-auto px-4 flex h-14 items-center justify-between">
                <div className="mr-4 hidden md:flex">
                  <span className="font-semibold">Echo Components</span>
                </div>
                <div className="flex items-center justify-end space-x-4">
                  <ThemeToggle />
                </div>
              </div>
            </header>
            <div className="container max-w-screen-2xl mx-auto px-4">
              <main className="py-6">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
