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
import { Textarea } from '@/components/ui/textarea';
import { UploadIcon } from 'lucide-react';

import { updateAppSchema } from '@/services/apps/owner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const AppDetails = () => {
  const form = useForm<z.infer<typeof updateAppSchema>>({
    resolver: zodResolver(updateAppSchema),
    defaultValues: {
      description: undefined,
      profilePictureUrl: undefined,
    },
  });

  const onSubmit = (data: z.infer<typeof updateAppSchema>) => {
    console.log(data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4 h-full"
      >
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
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full mt-auto"
          disabled={form.formState.isSubmitting || !form.formState.isValid}
        >
          Save
        </Button>
      </form>
    </Form>
  );
};
