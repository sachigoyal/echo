'use client';

import { updateAppSchema } from '@/services/apps/owner';
import {
  FormProvider,
  type FormProviderProps,
} from '../../_components/form/context';

interface Props
  extends Omit<FormProviderProps<typeof updateAppSchema>, 'schema'> {
  fields: (keyof typeof updateAppSchema.shape)[];
}

export const AppDetailsFormProvider = ({
  children,
  fields,
  ...props
}: Props) => {
  return (
    <FormProvider
      {...props}
      schema={updateAppSchema
        .pick(Object.fromEntries(fields.map(field => [field, true])))
        .required()}
    >
      {children}
    </FormProvider>
  );
};
