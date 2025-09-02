import { getIsOwner } from '../_lib/fetch';

export default async function AppReferralsLayout({
  owner,
  public: publicPage,
  children,
  params,
}: LayoutProps<'/app/[id]/referrals'>) {
  const { id } = await params;

  const isOwner = await getIsOwner(id);

  await new Promise(resolve => setTimeout(resolve, 10000));

  return (
    <div>
      {children}
      {isOwner ? owner : publicPage}
    </div>
  );
}
