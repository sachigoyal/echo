import { Body, Heading } from '@/app/(app)/_components/layout/page-utils';
import {
  CouponContainer,
  CouponDescription,
  CouponDivider,
  CouponFooter,
  CouponHeader,
  CouponLabel,
  CouponMarquee,
  CouponTitle,
  CouponValue,
} from '@/components/coupon';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { api } from '@/trpc/server';
import { Share } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function AdminCodePage(
  props: PageProps<'/admin/codes/[code]'>
) {
  const { code } = await props.params;

  const creditGrant = await checkCreditGrant(code);

  return (
    <div>
      <Heading title="Credit Grant" />
      <Body>
        <div className="grid grid-cols-1 lg:grid-cols-3 items-center gap-4 lg:gap-8">
          <div className="aspect-square shrink-0 bg-red-500">
            <Logo />
          </div>
          <CouponContainer className="col-span-1 lg:col-span-2 h-full justify-between">
            <CouponHeader>
              <CouponTitle>
                <CouponValue value={creditGrant.grantAmount} />
                <CouponLabel />
              </CouponTitle>
              <CouponDescription />
            </CouponHeader>
            <CouponMarquee size={48} />
            <CouponDivider />
            <CouponFooter>
              <Button
                variant="unstyled"
                className="w-full bg-white h-12 md:h-12 hover:bg-white/90"
              >
                Share Credit Grant <Share className="size-4" />
              </Button>
            </CouponFooter>
          </CouponContainer>
        </div>
      </Body>
    </div>
  );
}

const checkCreditGrant = async (code: string) => {
  try {
    return await api.credits.grant.get({ code });
  } catch (error) {
    return notFound();
  }
};
