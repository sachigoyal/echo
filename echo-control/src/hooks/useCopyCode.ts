import { useState, useCallback } from 'react';

export function useCopyCode() {
  const [copiedItems, setCopiedItems] = useState<Record<string, boolean>>({});

  const handleCopyCode = useCallback(async (code: string, itemId?: string) => {
    try {
      await navigator.clipboard.writeText(code);

      if (itemId) {
        setCopiedItems(prev => ({ ...prev, [itemId]: true }));

        // Reset the feedback after 2 seconds
        setTimeout(() => {
          setCopiedItems(prev => ({ ...prev, [itemId]: false }));
        }, 2000);
      }

      return true;
    } catch (err) {
      console.error('Failed to copy code:', err);
      return false;
    }
  }, []);

  const isCopied = useCallback(
    (itemId: string) => {
      return copiedItems[itemId] || false;
    },
    [copiedItems]
  );

  return {
    handleCopyCode,
    isCopied,
  };
}
