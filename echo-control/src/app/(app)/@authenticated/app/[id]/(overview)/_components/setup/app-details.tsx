'use client';

import Image from 'next/image';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Dropzone } from '@/components/ui/dropzone';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Check, Loader2, UploadIcon } from 'lucide-react';

import { updateAppSchema } from '@/services/apps/owner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActionState } from 'react';

interface Props {
  updateApp: (data: z.infer<typeof updateAppSchema>) => Promise<boolean>;
}

export const AppDetails: React.FC<Props> = ({ updateApp }) => {
  const form = useForm<z.infer<typeof updateAppSchema>>({
    resolver: zodResolver(
      updateAppSchema.refine(data => {
        return (
          data.description !== undefined && data.profilePictureUrl !== undefined
        );
      })
    ),
    defaultValues: {
      description: undefined,
      profilePictureUrl: undefined,
    },
    mode: 'onChange',
  });

  const [state, formAction, isPending] = useActionState(
    async (_: { success: boolean }, formData: FormData) => {
      const data = Object.fromEntries(formData);
      const parsedData = updateAppSchema.safeParse(data);
      if (!parsedData.success) {
        return { success: false, error: 'Invalid data' };
      }
      const result = await updateApp(data);
      if (result) {
        return { success: true };
      } else {
        return { success: false, error: 'Failed to update app details.' };
      }
    },
    { success: false, error: undefined }
  );

  return (
    <Form {...form}>
      <form action={formAction} className="flex flex-col gap-4 h-full">
        <FormField
          control={form.control}
          name="profilePictureUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile Picture</FormLabel>
              <FormControl>
                <Dropzone onDrop={field.onChange}>
                  {field.value ? (
                    <div className="flex justify-start items-center gap-2 w-full">
                      <Image
                        src={field.value}
                        alt="Profile Picture"
                        width={16}
                        height={16}
                      />
                      <span>Upload Successful</span>
                    </div>
                  ) : (
                    <div className="flex justify-start items-center gap-2 w-full text-muted-foreground/60">
                      <UploadIcon className="size-4" />
                      <span>Upload an image</span>
                    </div>
                  )}
                </Dropzone>
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
              <FormLabel>App Description</FormLabel>
              <FormControl>
                <Input
                  placeholder="A cloud-based web development agent that..."
                  {...field}
                  value={field.value ?? ''}
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
            isPending ||
            !form.formState.isDirty ||
            !form.formState.isValid ||
            state.success
          }
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : state.success ? (
            <Check className="size-4" />
          ) : (
            'Save'
          )}
        </Button>
      </form>
    </Form>
  );
};
