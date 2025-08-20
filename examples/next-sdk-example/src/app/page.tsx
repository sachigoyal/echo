import { getUser } from '@/echo';
import TabsContainer from './components/tabs-container';
import SignIn from './components/signin';

export default async function Home() {
  const user = await getUser();
  console.log({ user });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <SignIn />
      </div>
    );
  }
  const { name, email } = user;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-6">
        Next.js SDK Example {name} {email}
      </h1>
      <div className="w-full max-w-4xl">
        <TabsContainer />
      </div>
    </div>
  );
}
