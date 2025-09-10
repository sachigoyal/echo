'use client';

import { api } from '@/trpc/client';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

export default function TermsAgreement() {
  const session = useSession();

  const { data: needsTerms } = api.user.termsAgreement.needs.terms.useQuery(
    undefined,
    {
      enabled: !!session.data?.user,
    }
  );

  const utils = api.useUtils();

  const {
    mutate: acceptTerms,
    isPending: isAcceptingTerms,
    isSuccess: isAcceptedTerms,
  } = api.user.termsAgreement.accept.terms.useMutation({
    onSuccess: () => {
      toast.success('Terms of Service accepted');
      utils.user.termsAgreement.needs.terms.invalidate();
    },
  });

  return (
    <AlertDialog open={needsTerms?.needs}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Terms of Service</AlertDialogTitle>
          <AlertDialogDescription>
            {needsTerms?.currentVersion ? (
              'Our Terms of Service have changed. Please confirm you accept the latest version.'
            ) : (
              <>
                Please accept our{' '}
                <Link href="/terms" target="_blank" className="underline">
                  Terms of Service
                </Link>{' '}
                to continue.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={() => acceptTerms()}
            className="flex-1"
            disabled={isAcceptingTerms || isAcceptedTerms}
          >
            {isAcceptingTerms ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isAcceptedTerms ? (
              <Check className="size-4" />
            ) : (
              'Accept Terms'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
