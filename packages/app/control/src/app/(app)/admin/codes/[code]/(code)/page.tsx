import QRCode from 'react-qr-code';

import { Logo } from '@/components/ui/logo';
import { Card } from '@/components/ui/card';

import { Body, Heading } from '@/app/(app)/_components/layout/page-utils';

import { checkCreditGrant } from '../_lib/checks';

export default async function AdminCodePage(
  props: PageProps<'/admin/codes/[code]'>
) {
  const { code } = await props.params;

  const creditGrant = await checkCreditGrant(code);

  return (
    <div>
      <Heading
        title="Credit Grant"
        description="Scan this QR code to claim free Echo credits"
      />
      <Body>
        <p>aaa</p>
      </Body>
    </div>
  );
}
