import { ClaimCreditsContainer } from './_components/container';
import { LoadingCoupon } from './_components/coupon';

export default async function LoadingClaimCreditsPage() {
  return (
    <ClaimCreditsContainer>
      <LoadingCoupon />
    </ClaimCreditsContainer>
  );
}
