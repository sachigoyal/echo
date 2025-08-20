import { isSignedIn } from '@/echo';
import Link from 'next/link';
import TabsContainer from './components/tabs-container';

export default async function Home() {
  const signedIn = await isSignedIn();

  if (!signedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Link href="/api/echo/signin">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-6">Next.js SDK Example</h1>
      <div className="w-full max-w-4xl">
        <TabsContainer />
      </div>
    </div>
  );
}
