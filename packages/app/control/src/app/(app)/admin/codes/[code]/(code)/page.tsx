import { Body, Heading } from '@/app/(app)/_components/layout/page-utils';

import { checkCreditGrant } from '../_lib/checks';
import { EditCreditGrantForm } from './_components/edit-form';
import { DisableCreditGrantDialog } from './_components/disable-dialog';
import { Button } from '@/components/ui/button';
import { Share, Trash } from 'lucide-react';
import Link from 'next/link';

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
        actions={
          <div className="flex items-center gap-2">
            <DisableCreditGrantDialog creditGrantId={creditGrant.id}>
              <Button variant="destructiveOutline">
                <Trash className="size-4" />
                Disable
              </Button>
            </DisableCreditGrantDialog>
            <Link href={`/admin/codes/${code}/share`} passHref>
              <Button variant="turbo">
                <Share className="size-4" />
                Share
              </Button>
            </Link>
          </div>
        }
      />
      <Body>
        <EditCreditGrantForm id={creditGrant.id} creditGrant={creditGrant} />
      </Body>
    </div>
  );
}
