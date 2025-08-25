'use client';

import z from 'zod';

import { DefaultValues, useForm, Resolver, FieldValues } from 'react-hook-form';

import { Form } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';

export interface FormProviderProps<T> {
  children: React.ReactNode;
  schema: z.ZodType<T, any, any>;
  defaultValues: DefaultValues<T>;
  action: (values: T) => Promise<void>;
  onSuccess?: () => void;
  onError?: () => void;
  validationMode?: 'onBlur' | 'onChange' | 'onSubmit' | 'all' | 'onTouched';
}

export const FormProvider = <T,>({
  children,
  schema,
  defaultValues,
  action,
  onSuccess,
  onError,
  validationMode,
}: FormProviderProps<T>) => {
  const form = useForm({
    resolver: zodResolver(schema) as Resolver<
      FieldValues,
      any,
      z.core.output<T>
    >,
    defaultValues: defaultValues as DefaultValues<z.core.output<T>>,
    mode: validationMode,
  });

  const onSubmit = form.handleSubmit(async values => {
    try {
      await action(values as T);
      form.reset(values as FieldValues);
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
