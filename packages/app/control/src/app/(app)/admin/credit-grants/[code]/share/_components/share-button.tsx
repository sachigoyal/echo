'use client';

import React, { useState } from 'react';

import { Check, Share } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  url: string;
}

export const ShareButton: React.FC<Props> = ({ url }) => {
  const [isCopied, setIsCopied] = useState(false);

  const onCopy = () => {
    setIsCopied(true);

    navigator.clipboard.writeText(url);

    toast.success('Copied to clipboard');
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <Button
      variant="unstyled"
      className="w-full bg-white h-12 md:h-12 hover:bg-white/90"
      onClick={onCopy}
    >
      Share Credit Grant{' '}
      {isCopied ? <Check className="size-4" /> : <Share className="size-4" />}
    </Button>
  );
};
