"use client";

import { useEffect, useRef, useState } from 'react';
import { api } from '@/trpc/client';

export default function TermsAgreement() {
  const hasRunRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [needsTerms, setNeedsTerms] = useState(false);
  const [needsPrivacy, setNeedsPrivacy] = useState(false);

  const termsNeeds = api.user.termsAgreement.needs.terms.useQuery(undefined, {
    enabled: false,
  });
  const privacyNeeds = api.user.termsAgreement.needs.privacy.useQuery(
    undefined,
    { enabled: false }
  );

  const acceptTerms = api.user.termsAgreement.accept.terms.useMutation();
  const acceptPrivacy = api.user.termsAgreement.accept.privacy.useMutation();

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    Promise.all([termsNeeds.refetch(), privacyNeeds.refetch()])
      .then(([t, p]) => {
        const tNeeds = t.data?.needs ?? false;
        const pNeeds = p.data?.needs ?? false;
        setNeedsTerms(tNeeds);
        setNeedsPrivacy(pNeeds);
        if (tNeeds || pNeeds) setOpen(true);
      })
      .catch(() => {
        // Swallow; do not block app on failure
      });
  }, []);

  const onConfirm = async () => {
    const tasks: Promise<unknown>[] = [];
    if (needsTerms) tasks.push(acceptTerms.mutateAsync());
    if (needsPrivacy) tasks.push(acceptPrivacy.mutateAsync());

    await Promise.all(tasks).catch(() => {});

    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 text-black shadow-xl">
        <h2 className="mb-2 text-xl font-semibold">Please confirm updates</h2>
        <div className="mb-4 text-sm text-gray-700">
          {needsTerms && !needsPrivacy && (
            <p className="mb-2">
              Our Terms of Service have changed. Please confirm you accept the
              latest version.
            </p>
          )}
          {needsPrivacy && !needsTerms && (
            <p>
              Our Privacy Policy has changed. Please confirm you accept the
              latest version.
            </p>
          )}
          {needsTerms && needsPrivacy && (
            <p>
              Our Terms of Service and Privacy Policy have changed. Please confirm you accept the
              latest version.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setOpen(false)}
            className="w-1/2 rounded-md border border-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="w-1/2 rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-50"
            disabled={acceptTerms.isPending || acceptPrivacy.isPending}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}


