import { auth } from '@/auth';

export default async function AppLayout({
  authenticated,
  unauthenticated,
}: LayoutProps<'/'>) {
  const session = await auth();

  return session?.user ? authenticated : unauthenticated;
}
