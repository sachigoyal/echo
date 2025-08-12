'use client';

import { useState } from 'react';

import { Check, Copy } from 'lucide-react';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

import { api } from '@/trpc/client';

interface Props {
  echoAppId: string;
}

export const GenerateApiKey: React.FC<Props> = ({ echoAppId }) => {
  const [name, setName] = useState('');

  const {
    mutate: generateApiKey,
    isPending: isGenerating,
    data: apiKey,
    error,
  } = api.user.apiKeys.create.useMutation();

  const { isCopied, copyToClipboard } = useCopyToClipboard();

  if (apiKey) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 text-green-600 mb-6">
          <Check className="w-5 h-5" />
          <h2 className="text-lg font-semibold">
            App-Scoped API Key Generated
          </h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Your API Key
            </label>
            <div className="flex items-center gap-2">
              <p className="flex-1 px-3 py-2 border border-input bg-input text-input-foreground rounded-md font-mono text-sm resize-none">
                {apiKey.key}
              </p>
              <Button
                onClick={() => copyToClipboard(apiKey.key)}
                className="px-3 py-2 border border-input bg-input text-input-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {isCopied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">
              Important Security Notice
            </h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Keep this API key secure and never share it publicly</li>
              <li>• This key provides access to your Echo account</li>
              <li>• This key is scoped only to the selected Echo app</li>
              <li>• Store it safely in your CLI tool</li>
              <li>
                • You won&apos;t be able to see this key again after leaving
                this page
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Next Steps</h3>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Copy the API key above</li>
              <li>2. Return to your terminal</li>
              <li>3. Paste the API key when prompted</li>
              <li>4. Start using the Echo CLI with this app!</li>
            </ol>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => generateApiKey({ echoAppId, name })}
              className="flex-1 px-4 py-2 border border-input bg-input text-input-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Generate Another Key
            </Button>
            <Link
              href="/"
              className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 transition-colors text-center"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div>
        <Label
          htmlFor="api-key-name"
          className="block text-sm font-medium text-card-foreground mb-2"
        >
          API Key Name
        </Label>
        <Input
          id="api-key-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter a name for this API key"
          className="w-full px-3 py-2 border border-input bg-input text-input-foreground rounded-md focus:outline-hidden focus:ring-2 focus:ring-accent placeholder-muted-foreground"
        />
      </div>

      <Button
        onClick={() => generateApiKey({ echoAppId, name })}
        disabled={!echoAppId || isGenerating}
        className="w-full px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isGenerating ? 'Generating...' : 'Generate API Key'}
      </Button>
    </div>
  );
};
