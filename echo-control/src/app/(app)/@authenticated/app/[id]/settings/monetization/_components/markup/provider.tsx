'use client';

import { updateMarkupSchema } from '@/services/apps/owner';
import {
  FormProvider,
  type FormProviderProps,
} from '../../../_components/form/context';
import { toast } from 'sonner';
import z from 'zod';

interface Props
  extends Omit<
    FormProviderProps<z.infer<typeof updateMarkupSchema>>,
    'schema'
  > {}

export const MarkupFormProvider = ({ children, ...props }: Props) => {
  return (
    <FormProvider
      {...props}
      schema={updateMarkupSchema}
      onSuccess={() => {
        toast.success(`Markup updated successfully`);
      }}
    >
      {children}
    </FormProvider>
  );
};
