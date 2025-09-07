import { getUser, isSignedIn } from '@/echo';
import { Balance } from './components/balance';
import SignIn from './components/signin';
import TabsContainer from './components/tabs-container';

export default async function Home() {
  const _isSignedIn = await isSignedIn();
  const user = await getUser();

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
      <p className="text-lg mb-6">User: {user?.email}</p>
      <p className="text-lg mb-6">id: {user?.id}</p>
      <p className="text-lg mb-6">Name: {user?.name}</p>
      <Balance />
      <div className="w-full max-w-4xl">
        <TabsContainer />
      </div>
    </div>
  );
}
