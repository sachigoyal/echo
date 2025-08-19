import { isSignedIn } from '@/echo';
import Link from 'next/link';

export default async function Home() {
  const signedIn = await isSignedIn();

  if (!signedIn) {
    return <Link href="/api/echo/signin">Sign in</Link>;
  }

  return <div>Signed in</div>;
}
