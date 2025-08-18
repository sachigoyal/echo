'use client';

import { Check, Loader2, Percent, X } from 'lucide-react';

import { z } from 'zod';

import { zodResolver } from '@hookform/resolvers/zod';

import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

import { createAppSchema } from '@/services/apps/owner';

import { api } from '@/trpc/client';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

export const CreateAppForm = () => {
  const form = useForm<z.infer<typeof createAppSchema>>({
    resolver: zodResolver(createAppSchema),
    defaultValues: {
      name: '',
      markup: 2,
    },
    mode: 'onChange',
  });

  const router = useRouter();

  const {
    mutate: createApp,
    isPending,
    isSuccess,
  } = api.apps.owner.create.useMutation({
    onSuccess: ({ id }) => {
      router.push(`/apps/${id}`);
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: z.infer<typeof createAppSchema>) => {
    createApp(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Your App Name" />
              </FormControl>
              {fieldState.error ? (
                <FormMessage />
              ) : (
                <FormDescription>
                  This name will be shown to users when they connect their Echo
                  account
                </FormDescription>
              )}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="markup"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Markup</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Input
                      value={(field.value * 100).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                      onChange={e =>
                        field.onChange(Number(e.target.value) / 100)
                      }
                      className="w-18 pr-6"
                    />
                    <Percent className="size-3 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2" />
                  </div>
                  <Slider
                    min={1}
                    max={10}
                    step={0.01}
                    value={[field.value]}
                    onValueChange={value => field.onChange(value[0])}
                  />
                </div>
              </FormControl>
              {fieldState.error ? (
                <FormMessage />
              ) : (
                <FormDescription>
                  You will earn this markup as revenue for every LLM credit
                  spent on your app.
                </FormDescription>
              )}
            </FormItem>
          )}
        />
        <Separator />
        <Button
          type="submit"
          className="w-full"
          disabled={!form.formState.isValid || isPending || isSuccess}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isSuccess ? (
            <Check className="w-4 h-4" />
          ) : null}
          {isPending
            ? 'Creating...'
            : isSuccess
              ? 'Navigating to app...'
              : 'Create App'}
        </Button>
      </form>
    </Form>
  );
};
