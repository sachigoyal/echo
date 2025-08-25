'use client';

import { FormControl, FormDescription, FormItem } from '@/components/ui/form';
import { FormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFormContext } from 'react-hook-form';

export const GithubLinkInput = () => {
  const form = useFormContext();

  return (
    <Tabs
      value={form.watch('type')}
      onValueChange={value => form.setValue('type', value as 'user' | 'repo')}
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
                All profits will be claimable by this account on Merit Systems.
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
  );
};
