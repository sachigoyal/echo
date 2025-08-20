import { isSignedIn } from '@/echo';
import TabsContainer from './components/tabs-container';
import SignIn from './components/signin';

export default async function Home() {
  const _isSignedIn = await isSignedIn();

  if (!_isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <SignIn />
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
