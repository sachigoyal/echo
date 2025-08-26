'use client';

import z from 'zod';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
} from '@/components/ui/form';

import { updateGithubLinkSchema } from '@/services/apps/github-link';
import { GithubType } from '@/generated/prisma';
import { Check, Loader2 } from 'lucide-react';
import { api } from '@/trpc/client';
import { toast } from 'sonner';

const tabsTriggerClassName =
  'shadow-none rounded-none data-[state=active]:bg-primary/10 rounded-sm data-[state=active]:shadow-none p-0 px-1 h-fit cursor-pointer text-sm leading-none data-[state=active]:text-primary data-[state=active]:font-bold hover:bg-primary/10 transition-colors';

interface Props {
  githubLink: {
    type: GithubType;
    githubUrl: string | null;
  } | null;
  appId: string;
}

export const RecipientDetails: React.FC<Props> = ({ githubLink, appId }) => {
  const isComplete = githubLink !== null;

  const utils = api.useUtils();

  const {
    mutate: updateGithubLink,
    isPending,
    isSuccess,
  } = api.apps.app.githubLink.update.useMutation({
    onSuccess: () => {
      utils.apps.app.githubLink.get.invalidate(appId);
      toast.success('Github link updated');
    },
  });

  const form = useForm<z.infer<typeof updateGithubLinkSchema>>({
    resolver: zodResolver(updateGithubLinkSchema),
    defaultValues: {
      type: githubLink?.type ?? 'repo',
      url: githubLink?.githubUrl ?? '',
    },
  });

  const onSubmit = (data: z.infer<typeof updateGithubLinkSchema>) => {
    updateGithubLink({
      appId,
      ...data,
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3 h-full relative"
      >
        <Tabs
          value={form.watch('type')}
          onValueChange={value =>
            form.setValue('type', value as 'user' | 'repo')
          }
          className="flex flex-col gap-2"
        >
          <FormField
            control={form.control}
            name="type"
            render={() => (
              <FormItem className="">
                <FormControl>
                  <TabsList className="flex items-center gap-2 w-fit p-0 bg-transparent h-fit">
                    <TabsTrigger
                      value="repo"
                      onClick={() => {
                        form.setValue('type', 'repo');
                      }}
                      className={tabsTriggerClassName}
                    >
                      Pay to Repo
                    </TabsTrigger>
                    <span className="text-xs text-muted-foreground leading-none">
                      or
                    </span>
                    <TabsTrigger
                      value="user"
                      onClick={() => {
                        form.setValue('type', 'user');
                      }}
                      className={tabsTriggerClassName}
                    >
                      Pay to User
                    </TabsTrigger>
                  </TabsList>
                </FormControl>
              </FormItem>
            )}
          />

          <TabsContent value="user" className="flex flex-col gap-3">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem className="h-20 flex flex-col gap-2">
                  <FormControl className="h-full">
                    <Input
                      placeholder="richardhendricks"
                      {...field}
                      value={field.value.replace('https://github.com/', '')}
                      onChange={e => {
                        field.onChange(`https://github.com/${e.target.value}`);
                      }}
                      className="h-full"
                    />
                  </FormControl>
                  <FormDescription>
                    All profits will be claimable by this account on Merit
                    Systems.
                  </FormDescription>
                </FormItem>
              )}
            />
          </TabsContent>
          <TabsContent value="repo" className="flex flex-col gap-2">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem className="h-20 flex flex-col gap-2">
                  <FormControl className="h-full">
                    <Input
                      placeholder="facebook/react"
                      {...field}
                      value={field.value.replace('https://github.com/', '')}
                      onChange={e => {
                        field.onChange(`https://github.com/${e.target.value}`);
                      }}
                      onPaste={e => {
                        e.preventDefault();
                        const text = e.clipboardData.getData('text');
                        if (text.includes('github.com/')) {
                          field.onChange(text);
                        } else {
                          field.onChange(`https://github.com/${text}`);
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    All profits will be sent to this repo&apos;s Merit Systems
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
          disabled={
            form.formState.isSubmitting ||
            !form.formState.isValid ||
            isPending ||
            isSuccess ||
            isComplete
          }
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isSuccess || isComplete ? (
            <Check className="w-4 h-4" />
          ) : (
            'Save'
          )}
        </Button>
      </form>
    </Form>
  );
};
