import { useEffect, useState } from 'react';

import { Check, Copy, Info } from 'lucide-react';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Props {
  generateApiKey: (name?: string) => void;
  isPending: boolean;
  apiKey?: string;
}

export const GenerateApiKey: React.FC<Props> = ({
  generateApiKey,
  isPending,
  apiKey,
}) => {
  const [name, setName] = useState<string>();

  const { isCopied, copyToClipboard } = useCopyToClipboard(() => {
    toast.success('Copied to clipboard');
  });

  useEffect(() => {
    if (apiKey) {
      copyToClipboard(apiKey);
    }
  }, [apiKey, copyToClipboard]);

  if (apiKey) {
    return (
      <div className="flex flex-col gap-2">
        <div>
          <label className="block text-sm font-medium text-card-foreground mb-2">
            Your API Key
          </label>
          <div className="flex items-center w-full border border-primary shadow-md shadow-primary rounded-md overflow-hidden pl-2 pr-1 py-1 bg-muted">
            <p className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-sm no-scrollbar pr-2">
              {apiKey}
            </p>
            <Button
              onClick={() => copyToClipboard(apiKey)}
              variant="outline"
              className="shrink-0 size-fit p-2"
              size="icon"
            >
              {isCopied ? (
                <Check className="size-3" />
              ) : (
                <Copy className="size-3" />
              )}
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          You can add this API key to your CLI tool to use Echo from your
          terminal. Store this key somewhere secure since{' '}
          <strong>you won&apos;t be able to see it again</strong>. You can
          generate another key at any time.
        </p>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="link"
              className="size-fit p-0 text-muted-foreground/60"
            >
              <Info className="size-3" />
              Security Information
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Security Information</DialogTitle>
            </DialogHeader>
            <DialogDescription className="hidden" />
            <ul className="text-sm space-y-1">
              <li>• Keep this API key secure and never share it publicly</li>
              <li>• This key provides access to your Echo account</li>
              <li>• This key is scoped only to the selected Echo app</li>
              <li>• Store it safely in your CLI tool</li>
              <li>
                • You won&apos;t be able to see this key again after leaving
                this page
              </li>
            </ul>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label
          htmlFor="api-key-name"
          className="block text-sm font-medium text-card-foreground"
        >
          API Key Name
        </Label>
        <Input
          id="api-key-name"
          type="text"
          onChange={e => setName(e.target.value)}
          placeholder="Enter a name for this API key"
        />
      </div>

      <Button
        onClick={() => generateApiKey(name)}
        disabled={isPending}
        variant="turbo"
      >
        {isPending ? 'Generating...' : 'Generate API Key'}
      </Button>
    </div>
  );
};
