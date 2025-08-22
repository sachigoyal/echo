'use client';

import { Check, Loader2 } from 'lucide-react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';

import { updateAppSchema } from '@/services/apps/owner';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';

const descriptionSchema = z.object({
  description: z.string().min(1).max(250),
});

interface Props {
  description: string | null;
  updateApp: (data: z.infer<typeof updateAppSchema>) => Promise<void>;
}

export const Description: React.FC<Props> = ({ updateApp, description }) => {
  const isCompleted = description !== null;

  const form = useForm<z.infer<typeof descriptionSchema>>({
    resolver: zodResolver(descriptionSchema),
    defaultValues: {
      description: description ?? undefined,
    },
    mode: 'onChange',
  });

  const {
    mutate: updateAppDetails,
    isPending: isUpdating,
    isSuccess,
  } = useMutation({
    mutationFn: updateApp,
    onSuccess: () => {
      toast.success('App details updated');
    },
    onError: () => {
      toast.error('Failed to update app details');
    },
  });

  const handleSubmit = (data: z.infer<typeof descriptionSchema>) => {
    updateAppDetails(data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-4 h-full"
      >
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>App Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="A cloud-based web development agent that..."
                  {...field}
                  value={field.value ?? ''}
                  disabled={isCompleted}
                  className="resize-none h-20"
                  rows={4}
                  maxLength={250}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full mt-auto"
          disabled={
            isUpdating ||
            !form.formState.isDirty ||
            !form.formState.isValid ||
            isSuccess ||
            isCompleted
          }
        >
          {isUpdating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isSuccess ? (
            <Check className="size-4" />
          ) : isCompleted ? (
            <Check className="size-4" />
          ) : (
            'Save'
          )}
        </Button>
      </form>
    </Form>
  );
};
