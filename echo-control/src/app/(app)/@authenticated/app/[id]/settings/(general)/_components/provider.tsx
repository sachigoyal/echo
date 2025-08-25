'use client';

import { updateAppSchema } from '@/services/apps/owner';
import {
  FormProvider,
  type FormProviderProps,
} from '../../_components/form/context';
import { toast } from 'sonner';

interface Props
  extends Omit<FormProviderProps<typeof updateAppSchema>, 'schema'> {
  fields: (keyof typeof updateAppSchema.shape)[];
  title: string;
}

export const AppDetailsFormProvider = ({
  children,
  fields,
  title,
  ...props
}: Props) => {
  return (
    <FormProvider
      {...props}
      schema={updateAppSchema
        .pick(Object.fromEntries(fields.map(field => [field, true])))
        .required()}
      onSuccess={() => {
        toast.success(`${title} updated successfully`);
      }}
    >
      {children}
    </FormProvider>
  );
};
