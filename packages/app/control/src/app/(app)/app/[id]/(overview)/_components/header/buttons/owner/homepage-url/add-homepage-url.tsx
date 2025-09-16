import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { api } from '@/trpc/client';
import { Check, Loader2, Zap } from 'lucide-react';
import { useForm } from 'react-hook-form';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormLabel,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface Props {
  appId: string;
}

const addHomepageUrlSchema = z.object({
  homepageUrl: z.url(),
});

export const AddHomepageUrl: React.FC<Props> = ({ appId }) => {
  const form = useForm<z.infer<typeof addHomepageUrlSchema>>({
    resolver: zodResolver(addHomepageUrlSchema),
    defaultValues: {
      homepageUrl: '',
    },
  });

  const utils = api.useUtils();
  const {
    mutate: updateAppDetails,
    isPending: isUpdating,
    isSuccess,
  } = api.apps.app.update.useMutation();

  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (data: z.infer<typeof addHomepageUrlSchema>) => {
    updateAppDetails(
      { appId, ...data },
      {
        onSuccess: () => {
          toast.success('App details updated');
          setIsOpen(false);
          utils.apps.app.get.invalidate({ appId });
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="turbo">
          <Zap className="size-4" />
          Add Homepage URL
        </Button>
      </DialogTrigger>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Homepage URL</DialogTitle>
              <DialogDescription>
                The URL of the deployed version of your app.
              </DialogDescription>
            </DialogHeader>

            <FormField
              control={form.control}
              name="homepageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Homepage URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="https://example.com"
                      onPaste={e => {
                        e.preventDefault();
                        const text = e.clipboardData.getData('text');
                        const url = new URL(text);
                        field.onChange(url.toString());
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="submit"
                disabled={isUpdating || isSuccess || !form.formState.isValid}
                onClick={() => {
                  form.handleSubmit(handleSubmit)();
                }}
              >
                {isUpdating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isSuccess ? (
                  <Check className="size-4" />
                ) : (
                  'Add Homepage URL'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Form>
    </Dialog>
  );
};
