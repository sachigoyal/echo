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

  const creditGrantCode = await checkCreditGrantCode(code);

  const canUse = Boolean(
    creditGrantCode.maxUsesPerUser &&
      creditGrantCode.maxUsesPerUser > creditGrantCode.usages.length
  );

  return (
    <ClaimCreditsContainer>
      <ClaimCreditsCoupon
        value={creditGrantCode.grantAmount}
        code={code}
        canUse={canUse}
      />
    </ClaimCreditsContainer>
  );
}

const checkCreditGrantCode = async (code: string) => {
  try {
    return await api.credits.grant.getWithUsages({ code });
  } catch {
    return notFound();
  }
};
