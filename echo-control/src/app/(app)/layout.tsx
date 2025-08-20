import { auth } from '@/auth';

export default async function AppLayout({
  authenticated,
  unauthenticated,
}: {
  children: React.ReactNode;
  authenticated: React.ReactNode;
  unauthenticated: React.ReactNode;
}) {
  const session = await auth();

  return session?.user ? authenticated : unauthenticated;
}
