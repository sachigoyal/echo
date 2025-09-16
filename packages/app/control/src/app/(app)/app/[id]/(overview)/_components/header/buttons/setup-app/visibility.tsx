'use client';

import { Check, Globe, Loader2, Lock } from 'lucide-react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';

import { toast } from 'sonner';
import { api } from '@/trpc/client';
import { EchoApp } from '@/generated/prisma';

const visibilitySchema = z.object({
  isPublic: z.boolean(),
});

interface Props {
  appId: string;
  isPublic: EchoApp['isPublic'];
}

export const Visibility: React.FC<Props> = ({ appId, isPublic }) => {
  const form = useForm<z.infer<typeof visibilitySchema>>({
    resolver: zodResolver(visibilitySchema),
    defaultValues: {
      isPublic: isPublic ?? undefined,
    },
    mode: 'onChange',
  });

  const utils = api.useUtils();

  const {
    mutate: updateAppDetails,
    isPending: isUpdating,
    isSuccess,
  } = api.apps.app.update.useMutation({
    onSuccess: () => {
      toast.success('App details updated');
      utils.apps.app.get.invalidate({ appId });
    },
    onError: () => {
      toast.error('Failed to update app details');
    },
  });

  const handleSubmit = (data: z.infer<typeof visibilitySchema>) => {
    updateAppDetails({
      appId,
      ...data,
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-4 h-full"
      >
        <FormField
          control={form.control}
          name="isPublic"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex items-center gap-2 w-full overflow-hidden">
                  {[
                    {
                      value: true,
                      title: 'Public',
                      description: 'Show in the app store',
                      Icon: Globe,
                    },
                    {
                      value: false,
                      title: 'Private',
                      description: 'Hide from the app store',
                      Icon: Lock,
                    },
                  ].map(({ value, title, description, Icon }) => (
                    <Button
                      variant={
                        field.value === value ? 'primaryOutline' : 'outline'
                      }
                      onClick={e => {
                        e.preventDefault();
                        field.onChange(value);
                      }}
                      className="flex-1 flex-col h-20 md:h-20"
                    >
                      <Icon className="size-8" />
                      <div className="flex flex-col">
                        <h3 className="text-sm font-semibold">{title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {description}
                        </p>
                      </div>
                    </Button>
                  ))}
                </div>
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
            isSuccess
          }
        >
          {isUpdating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isSuccess ? (
            <Check className="size-4" />
          ) : (
            'Save'
          )}
        </Button>
      </form>
    </Form>
  );
};
