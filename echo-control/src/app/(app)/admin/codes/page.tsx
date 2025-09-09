import { CreditCodeMinter } from '@/components/admin/CreditCodeMinter';
import { userOrRedirect } from '@/auth/user-or-redirect';
import { unauthorized } from 'next/navigation';

export default async function AdminCodesPage(props: PageProps<'/admin/codes'>) {
  const user = await userOrRedirect('/admin/codes', props);

  if (!user) {
    return unauthorized();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Referral Codes</h1>
        <p className="text-muted-foreground mt-2">
          Manage and mint referral codes for users to get free credits
        </p>
      </div>

      <CreditCodeMinter />
    </div>
  );
}
