'use client';

import { updateGithubLinkSchema } from '@/services/apps/owner';
import {
  FormProvider,
  type FormProviderProps,
} from '../../../_components/form/context';
import { toast } from 'sonner';
import z from 'zod';

interface Props
  extends Omit<
    FormProviderProps<z.infer<typeof updateGithubLinkSchema>>,
    'schema'
  > {}

export const GithubLinkFormProvider = ({ children, ...props }: Props) => {
  return (
    <FormProvider
      {...props}
      schema={updateGithubLinkSchema}
      onSuccess={() => {
        toast.success(`Github link updated successfully`);
      }}
    >
      {children}
    </FormProvider>
  );
};
