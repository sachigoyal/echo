'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/registry/echo/ui/echo-button';

interface CopyCommandProps {
  command: string;
}

export function CopyCommand({ command }: CopyCommandProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative flex items-center space-x-2 rounded-md border px-4 py-2.5 bg-muted">
      <div className="flex-1 font-mono text-sm">{command}</div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onCopy}
        className="h-8 w-8 shrink-0"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        <span className="sr-only">Copy command</span>
      </Button>
    </div>
  );
}
