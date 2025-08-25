'use client';

import z from 'zod';

import { DefaultValues, useForm, Resolver } from 'react-hook-form';

import { Form } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';

export interface FormProviderProps<Schema extends z.ZodObject> {
  children: React.ReactNode;
  schema: Schema;
  defaultValues: DefaultValues<z.infer<Schema>>;
  action: (values: z.infer<Schema>) => Promise<void>;
  onSuccess?: () => void;
  onError?: () => void;
}

export const FormProvider = <Schema extends z.ZodObject>({
  children,
  schema,
  defaultValues,
  action,
  onSuccess,
  onError,
}: FormProviderProps<Schema>) => {
  const form = useForm<z.infer<Schema>>({
    resolver: zodResolver(schema) as Resolver<z.infer<Schema>>,
    defaultValues: defaultValues as DefaultValues<z.infer<Schema>>,
    mode: 'onChange',
  });

  const onSubmit = form.handleSubmit(async values => {
    try {
      await action(values);
      form.reset(values);
      onSuccess?.();
    } catch (error) {
      onError?.();
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>{children}</form>
    </Form>
  );
};
