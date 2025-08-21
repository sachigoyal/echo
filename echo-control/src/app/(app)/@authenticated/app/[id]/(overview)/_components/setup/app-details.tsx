'use client';

import Image from 'next/image';

import { Check, Loader2, UploadIcon } from 'lucide-react';

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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { api } from '@/trpc/client';

import { updateAppSchema } from '@/services/apps/owner';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

interface Props {
  description: string | null;
  profilePictureUrl: string | null;
  updateApp: (data: z.infer<typeof updateAppSchema>) => Promise<boolean>;
}

export const AppDetails: React.FC<Props> = ({
  updateApp,
  description,
  profilePictureUrl,
}) => {
  const isCompleted = description !== null && profilePictureUrl !== null;

  const form = useForm<z.infer<typeof updateAppSchema>>({
    resolver: zodResolver(
      updateAppSchema.refine(data => {
        return (
          data.description !== undefined || data.profilePictureUrl !== undefined
        );
      })
    ),
    defaultValues: {
      description: description ?? undefined,
      profilePictureUrl: profilePictureUrl ?? undefined,
    },
    mode: 'onChange',
  });

  const { mutate: uploadImage, isPending: isUploading } =
    api.upload.image.useMutation({
      onSuccess: ({ url }) => form.setValue('profilePictureUrl', url),
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
  });

  const handleSubmit = (data: z.infer<typeof updateAppSchema>) => {
    updateAppDetails(data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-4 h-full"
      >
        <div className="flex flex-col md:flex-row items-start gap-2">
          <FormField
            control={form.control}
            name="profilePictureUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile Picture</FormLabel>
                <FormControl>
                  <Dropzone
                    accept={{
                      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
                    }}
                    maxFiles={1}
                    maxSize={5 * 1024 * 1024}
                    onDrop={async files => {
                      if (files.length === 0) {
                        toast.error('No file selected');
                        return;
                      }
                      uploadImage(files[0]);
                    }}
                    disabled={isUploading || isCompleted}
                    className="size-24"
                  >
                    {field.value ? (
                      <Image
                        src={field.value}
                        alt="Profile Picture"
                        width={32}
                        height={32}
                      />
                    ) : (
                      <UploadIcon className="size-4" />
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
                    disabled={isCompleted}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button
          type="submit"
          className="w-full mt-auto"
          disabled={
            isUpdating ||
            isUploading ||
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
