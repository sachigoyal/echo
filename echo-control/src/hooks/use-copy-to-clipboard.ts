import { useState } from 'react';

export const useCopyToClipboard = (onCopy?: () => void) => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    onCopy?.();
  };

  return {
    isCopied,
    copyToClipboard,
  };
};
