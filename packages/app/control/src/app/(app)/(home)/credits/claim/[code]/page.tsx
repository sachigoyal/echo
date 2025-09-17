import { notFound } from 'next/navigation';

import { ClaimCreditsCoupon } from './_components/coupon';

import { userOrRedirect } from '@/auth/user-or-redirect';

import { api } from '@/trpc/server';
import { ClaimCreditsContainer } from './_components/container';

export default async function ClaimCreditsPage(
  props: PageProps<'/credits/claim/[code]'>
) {
  const { code } = await props.params;

  await userOrRedirect(`/credits/claim/${code}`, props);

  const referralCode = await checkReferralCode(code);

  return (
    <ClaimCreditsContainer>
      <ClaimCreditsCoupon value={referralCode.grantAmount!} code={code} />
    </ClaimCreditsContainer>
  );
}

const checkReferralCode = async (code: string) => {
  try {
    return await api.credits.grant.get({ code });
  } catch {
    return notFound();
  }
};
