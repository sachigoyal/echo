import { auth } from '@/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BalanceButton } from './_components/navbar/balance';
import { UserDropdown } from './_components/navbar/user-dropdown';
import { Logo } from '@/components/ui/logo';
import { LogoContainer } from './_components/logo';

export default async function AuthenticatedLayout({
  children,
  header,
  headerActions,
}: {
  children: React.ReactNode;
  header: React.ReactNode;
  headerActions: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    return (
      <p>
        The user arrived at this page without being authenticated. The
        middleware should have redirected them to the login page. This is a bug.
      </p>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <LogoContainer>
        <Logo className="size-auto h-full aspect-square" />
      </LogoContainer>
      <header className="w-full flex flex-col pt-4 justify-center">
        <div className="flex items-center justify-between w-full px-2 md:px-6 pb-0 md:pb-0">
          <div className="pl-11">{header}</div>
          <div className="flex items-center space-x-3">
            <Link href="/apps/create">
              <Button variant="outline">Create App</Button>
            </Link>
            <BalanceButton />
            <UserDropdown user={session.user} />
          </div>
        </div>
      </header>
      <div className="w-full border-b px-2 md:px-6 pt-2.5 sticky top-0 z-10 bg-card">
        {headerActions}
      </div>
      <div className="bg-background flex-1">{children}</div>
    </div>
  );
}
