'use client';

import { Check, Copy } from 'lucide-react';

import { Button, ButtonProps } from './button';
import { toast } from 'sonner';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

interface Props extends ButtonProps {
  text: string;
  toastMessage?: string;
  onCopy?: () => void;
}

export const CopyButton: React.FC<Props> = ({
  text,
  toastMessage,
  onCopy,
  ...props
}) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard(() => {
    if (toastMessage) {
      toast.success(toastMessage);
    }
    onCopy?.();
  });

  return (
    <Button
      onClick={() => copyToClipboard(text)}
      variant="outline"
      className="shrink-0 size-fit p-2"
      size="icon"
      {...props}
    >
      {isCopied ? <Check className="size-3" /> : <Copy className="size-3" />}
    </Button>
  );
};
