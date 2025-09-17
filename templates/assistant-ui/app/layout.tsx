import { isSignedIn } from '@/echo';
import { Providers } from '@/providers';
import { EchoTokens } from '@merit-systems/echo-next-sdk/client';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI SDK v5 Example',
  description: 'Example using @assistant-ui/react with AI SDK v5',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const signedIn = await isSignedIn();

  return (
    <html lang="en">
      <body className="h-dvh">
        <Providers>
          {signedIn ? (
            children
          ) : (
            <div className="h-full flex items-center justify-center p-6">
              <div className="flex flex-col items-center gap-4">
                <h1 className="text-2xl font-semibold">
                  Welcome to Echo + Assistant UI
                </h1>
                <p className="text-muted-foreground">
                  Sign in to start chatting.
                </p>
                <EchoTokens />
              </div>
            </div>
          )}
        </Providers>
      </body>
    </html>
  );
}
