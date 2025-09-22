'use client';

import type z from 'zod';

import { CalendarDays, Check, Loader2 } from 'lucide-react';

import { format } from 'date-fns';

import type { DefaultValues } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { MoneyInput } from '@/components/ui/money-input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

import { adminCreateCreditGrantSchema } from '@/services/db/admin/schemas';
import { useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  title: string;
  description: string;
  submitButtonText: string;
  onSubmit: (data: z.infer<typeof adminCreateCreditGrantSchema>) => void;
  isSubmitting: boolean;
  isSuccess?: boolean;
  defaultValues?: DefaultValues<z.input<typeof adminCreateCreditGrantSchema>>;
}

export const CreditGrantForm: React.FC<Props> = ({
  title,
  description,
  submitButtonText,
  onSubmit,
  isSubmitting,
  isSuccess,
  defaultValues,
}) => {
  const form = useForm<
    z.input<typeof adminCreateCreditGrantSchema>,
    unknown,
    z.output<typeof adminCreateCreditGrantSchema>
  >({
    resolver: zodResolver(adminCreateCreditGrantSchema),
    mode: 'onChange',
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const handleSubmit = (data: z.infer<typeof adminCreateCreditGrantSchema>) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Card>
          <CardHeader className="border-b">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="py-4 flex flex-col gap-4">
            <FormField
              control={form.control}
              name="grantAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <MoneyInput
                      setAmount={amount => field.onChange(amount)}
                      placeholder="10.00"
                      initialAmount={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter name"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter description"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel>
                      Expiration Date (Defaults to 1 year from now)
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start">
                          <CalendarDays className="size-4" />
                          {field.value
                            ? format(field.value, 'MM/dd/yyyy')
                            : 'Select Date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 size-fit">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxUses"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel>Max Uses (Empty for unlimited)</FormLabel>
                    <FormControl>
                      <Input
                        id="maxUses"
                        placeholder="Enter maximum number of uses"
                        onChange={e => {
                          if (e.target.value === '') {
                            field.onChange(undefined);
                          } else {
                            field.onChange(Number(e.target.value));
                          }
                        }}
                        defaultValue={field.value ?? undefined}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxUsesPerUser"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel>
                      Max Uses Per User (Empty for unlimited)
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="maxUsesPerUser"
                        placeholder="Enter maximum uses per user"
                        onChange={e => {
                          if (e.target.value === '') {
                            field.onChange(undefined);
                          } else {
                            field.onChange(Number(e.target.value));
                          }
                        }}
                        defaultValue={field.value ?? undefined}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="border-t p-4">
            <Button
              type="submit"
              variant={
                (form.formState.isDirty && form.formState.isValid) ||
                isSubmitting ||
                isSuccess
                  ? 'turbo'
                  : 'primaryOutline'
              }
              disabled={
                isSubmitting ||
                Boolean(isSuccess) ||
                !form.formState.isValid ||
                !form.formState.isDirty
              }
              className="w-full"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isSuccess ? (
                <Check className="size-4" />
              ) : (
                submitButtonText
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};
