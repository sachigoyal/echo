import { Body, Heading } from '@/app/(app)/_components/layout/page-utils';

import { checkCreditGrant } from '../_lib/checks';
import { EditCreditGrantForm } from './_components/edit-form';
import { DisableCreditGrantDialog } from './_components/disable-dialog';
import { Button } from '@/components/ui/button';
import { QrCode, Share, Trash } from 'lucide-react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { CopyCode } from '@/components/ui/copy-code';
import { api, HydrateClient } from '@/trpc/server';
import { CreditGrantUsersTable } from './_components/users-table';

export default async function AdminCodePage(
  props: PageProps<'/admin/codes/[code]'>
) {
  const { code } = await props.params;

  const creditGrant = await checkCreditGrant(code);

  api.admin.creditGrants.grant.listUsers.prefetchInfinite({
    code,
  });

  return (
    <HydrateClient>
      <Heading
        title="Credit Grant"
        description="Edit this credit grant"
        actions={
          <DisableCreditGrantDialog creditGrantId={creditGrant.id}>
            <Button variant="destructiveOutline">
              <Trash className="size-4" />
              Disable
            </Button>
          </DisableCreditGrantDialog>
        }
      />
      <Body>
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Claim Link</CardTitle>
            <CardDescription>
              Users can claim this credit grant by visiting this link.
            </CardDescription>
          </CardHeader>
          <CardContent className="py-4">
            <CopyCode
              code={`${process.env.ECHO_CONTROL_APP_BASE_URL}/credits/claim/${code}`}
              toastMessage="Copied to clipboard"
            />
          </CardContent>
          <CardFooter className="border-t py-4">
            <Link
              href={`/admin/codes/${code}/share`}
              passHref
              className="w-full"
            >
              <Button variant="turbo" className="font-bold w-full" size="lg">
                <QrCode className="size-4" />
                See QR Code
              </Button>
            </Link>
          </CardFooter>
        </Card>
        <EditCreditGrantForm id={creditGrant.id} creditGrant={creditGrant} />
        <CreditGrantUsersTable code={code} />
      </Body>
    </HydrateClient>
  );
}
