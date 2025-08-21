'use client';

import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { updateGithubLinkSchema } from '@/services/apps/owner';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';

export const RecipientDetails = () => {
  const form = useForm<z.infer<typeof updateGithubLinkSchema>>({
    resolver: zodResolver(updateGithubLinkSchema),
    defaultValues: {
      type: 'repo',
      value: '',
    },
  });

  const onSubmit = (data: z.infer<typeof updateGithubLinkSchema>) => {
    console.log(data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3 h-full"
      >
        <Tabs
          value={form.watch('type')}
          onValueChange={value =>
            form.setValue('type', value as 'user' | 'repo')
          }
          className="flex flex-col gap-3"
        >
          <FormField
            control={form.control}
            name="type"
            render={() => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger
                      value="user"
                      onClick={() => {
                        form.setValue('type', 'user');
                      }}
                    >
                      User
                    </TabsTrigger>
                    <TabsTrigger
                      value="repo"
                      onClick={() => {
                        form.setValue('type', 'repo');
                      }}
                    >
                      Repo
                    </TabsTrigger>
                  </TabsList>
                </FormControl>
              </FormItem>
            )}
          />

          <TabsContent value="user" className="flex flex-col gap-3">
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GitHub Username</FormLabel>
                  <FormControl>
                    <Input placeholder="richardhendricks" {...field} />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    All profits will be claimable by this account on Merit
                    Systems.
                  </FormDescription>
                </FormItem>
              )}
            />
          </TabsContent>
          <TabsContent value="repo" className="flex flex-col gap-3">
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GitHub Repository</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://github.com/facebook/react"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    All profits will be sent to this repo's Merit Systems
                    account.
                  </FormDescription>
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>
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
