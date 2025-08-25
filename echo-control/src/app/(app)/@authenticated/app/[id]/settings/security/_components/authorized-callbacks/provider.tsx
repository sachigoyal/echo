'use client';

import { updateAuthorizedCallbackUrlsSchema } from '@/services/apps/owner';
import {
  FormProvider,
  type FormProviderProps,
} from '../../../_components/form/context';
import { toast } from 'sonner';
import z from 'zod';

type Props = Omit<
  FormProviderProps<z.infer<typeof updateAuthorizedCallbackUrlsSchema>>,
  'schema'
>;

export const AuthorizedCallbacksFormProvider: React.FC<Props> = ({
  children,
  ...props
}) => {
  return (
    <FormProvider
      {...props}
      schema={updateAuthorizedCallbackUrlsSchema}
      onSuccess={() => {
        toast.success(`Authorized callbacks updated successfully`);
      }}
    >
      {children}
    </FormProvider>
  );
};
