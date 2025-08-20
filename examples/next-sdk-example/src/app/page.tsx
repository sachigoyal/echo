import { getEchoToken, isSignedIn } from '@/echo';
import Link from 'next/link';
import Chat from './components/chat';

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
    <div className="flex flex-col items-center justify-center h-screen">
      {/* <p>Echo token: {echoToken}</p> */}
      <div className="w-full max-w-md p-4 rounded-lg shadow-md border border-gray-200">
        <Chat />
      </div>
    </div>
  );
}
