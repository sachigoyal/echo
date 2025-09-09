"use client";

import { useEffect, useRef, useState } from 'react';
import { api } from '@/trpc/client';

export default function FreeTier() {
  const hasRunRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);

  const issue = api.user.initialFreeTier.issue.useMutation({
    onSuccess: data => {
      if (data.minted) {
        setAmount(data.amountInDollars);
        setOpen(true);
      }
    },
  });

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;
    issue.mutate();
  }, []);

  if (!open || amount == null) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 text-black shadow-xl">
        <h2 className="mb-2 text-xl font-semibold">Welcome to Echo!</h2>
        <p className="mb-6 text-sm text-gray-700">
          You just received <span className="font-semibold">${amount.toFixed(2)}</span> free tier credits!
        </p>
        <button
          onClick={() => setOpen(false)}
          className="w-full rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800"
        >
          Continue
        </button>
      </div>
    </div>
  );
}


