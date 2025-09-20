'use client';

import type z from 'zod';

import { toast } from 'sonner';

import type { RouterOutputs } from '@/trpc/client';
import { api } from '@/trpc/client';

import type { adminCreateCreditGrantSchema } from '@/services/db/ops/admin/schemas';
import { CreditGrantForm } from '../../../_components/form';
import { revalidateCodePage } from '../_actions/revalidate';

interface Props {
  id: string;
  creditGrant: RouterOutputs['admin']['creditGrants']['grant']['get'];
}

export const EditCreditGrantForm: React.FC<Props> = ({ id, creditGrant }) => {
  const utils = api.useUtils();

  const { mutate: editCreditGrant, isPending } =
    api.admin.creditGrants.grant.update.useMutation({
      onSuccess: ({ code }) => {
        void utils.admin.creditGrants.list.invalidate();
        void revalidateCodePage(code);
        toast.success('Credit grant updated');
      },
      onError: error => {
        toast.error(error.message);
      },
    });

  const onSubmit = (data: z.infer<typeof adminCreateCreditGrantSchema>) => {
    editCreditGrant({
      id,
      ...data,
    });
  };

  return (
    <CreditGrantForm
      title="Edit Credit Grant"
      description="Edit the credit grant"
      submitButtonText="Save"
      onSubmit={onSubmit}
      isSubmitting={isPending}
      defaultValues={{
        expiresAt: creditGrant.expiresAt,
        maxUsesPerUser: creditGrant.maxUsesPerUser ?? undefined,
        maxUses: creditGrant.maxUses ?? undefined,
        grantAmount: creditGrant.grantAmount,
        name: creditGrant.name ?? undefined,
        description: creditGrant.description ?? undefined,
      }}
    />
  );
};
