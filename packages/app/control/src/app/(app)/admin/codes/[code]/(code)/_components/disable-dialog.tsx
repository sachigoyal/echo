'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { api } from '@/trpc/client';

interface Props {
  creditGrantId: string;
  children: React.ReactNode;
}

export const DisableCreditGrantDialog: React.FC<Props> = ({
  creditGrantId,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const utils = api.useUtils();
  const {
    mutate: disableCreditGrant,
    isPending,
    isSuccess,
  } = api.admin.creditGrants.grant.update.useMutation({
    onSuccess: () => {
      utils.admin.creditGrants.list.invalidate();
      setIsOpen(false);
    },
  });
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Disable Credit Grant</DialogTitle>
          <DialogDescription>
            Are you sure you want to disable this credit grant?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isPending || isSuccess}
          >
            Cancel
          </Button>
          <Button
            onClick={() =>
              disableCreditGrant({ id: creditGrantId, isArchived: true })
            }
            disabled={isPending || isSuccess}
          >
            Disable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
