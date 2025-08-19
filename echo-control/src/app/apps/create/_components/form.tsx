'use client';

import { useState } from 'react';

import { Check, Loader2, Percent } from 'lucide-react';

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { FormFieldWithCard } from '@/components/ui/card-form';
import { Separator } from '@/components/ui/separator';

import { ProfitChart } from './chart';

import { createAppSchema } from '@/services/apps/owner';

import { api } from '@/trpc/client';

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
      router.push(`/apps/new/${id}`);
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: z.infer<typeof createAppSchema>) => {
    createApp(data);
  };

  const [selectedMarkupLabel, setSelectedMarkupLabel] =
    useState<string>('Medium');

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-2 md:space-y-4 w-full"
      >
        <FormFieldWithCard
          name="name"
          label="Name"
          render={field => (
            <Input
              {...field}
              placeholder="Enter a Name"
              className="bg-transparent dark:bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none p-0 h-fit font-bold"
            />
          )}
          description="This name will be shown to users when they connect their Echo account"
        />
        <FormFieldWithCard
          name="markup"
          label="Markup"
          description="You will earn this markup as revenue for every LLM credit spent on your app."
          render={field => (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 w-full">
                {[
                  {
                    label: 'Low',
                    value: 2,
                  },
                  {
                    label: 'Medium',
                    value: 4,
                  },
                  {
                    label: 'High',
                    value: 8,
                  },
                  {
                    label: 'Custom',
                    value: field.value,
                  },
                ].map(({ label, value }) => (
                  <Button
                    key={label}
                    variant={
                      label === selectedMarkupLabel ? 'turbo' : 'outline'
                    }
                    size="sm"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedMarkupLabel(label);
                      if (label !== 'Custom') {
                        field.onChange(value);
                      }
                    }}
                    className="flex-1 flex-col gap-0 h-full p-2 justify-start"
                  >
                    <span className="text-sm font-bold">{label}</span>
                    {label === 'Custom' ? (
                      <span className="text-xs opacity-60">Enter a Value</span>
                    ) : (
                      <span className="text-xs opacity-80">
                        {(value - 1) * 100}%
                      </span>
                    )}
                  </Button>
                ))}
              </div>
              {selectedMarkupLabel === 'Custom' && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Input
                      value={((field.value - 1) * 100).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }
                      )}
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
              )}
              <div className="w-full mt-4">
                <ProfitChart markup={form.watch('markup') - 1} />
              </div>
            </div>
          )}
        />
        <Separator />
        <Button
          type="submit"
          className="w-full"
          disabled={!form.formState.isValid || isPending || isSuccess}
          variant="turbo"
          size="lg"
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
