'use client';

import z from 'zod';

import { CalendarDays, Check, Loader2 } from 'lucide-react';

import { addYears, format } from 'date-fns';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { MoneyInput } from '@/components/ui/money-input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

import { api } from '@/trpc/client';

import { adminCreateCreditGrantSchema } from '@/services/admin/schemas';
import { CreditGrantForm } from '../../_components/form';
import { useRouter } from 'next/navigation';

export const CreateCreditGrantForm = () => {
  const utils = api.useUtils();

  const router = useRouter();

  const {
    mutateAsync: createCreditGrant,
    isPending,
    isSuccess,
  } = api.admin.creditGrants.create.useMutation({
    onSuccess: ({ code }) => {
      utils.admin.creditGrants.list.invalidate();
      toast.success('Credit grant created');
      router.push(`/admin/codes/${code}`);
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const onSubmit = async (
    data: z.infer<typeof adminCreateCreditGrantSchema>
  ) => {
    await createCreditGrant(data);
  };

  return (
    <CreditGrantForm
      onSubmit={onSubmit}
      isSubmitting={isPending}
      isSuccess={isSuccess}
      defaultValues={{
        expiresAt: addYears(new Date(), 1),
        maxUsesPerUser: 1,
      }}
    />
  );
};
