import React from 'react';

import { Terminal, Key } from 'lucide-react';

import { api } from '@/trpc/server';
import { GenerateKeyWithSelect } from './_components/generate-key';

export default async function CLIAuthPage() {
  const apps = api.apps.public.list.prefetchInfinite({
    cursor: 0,
    limit: 100,
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-card-foreground flex items-center gap-3">
          <Terminal className="w-8 h-8" />
          CLI Authentication
        </h1>
        <p className="text-muted-foreground mt-2">
          Generate an API key to authenticate with the Echo CLI. Each API key is
          scoped to a specific Echo app.
        </p>
      </div>

      <GenerateKeyWithSelect />
    </div>
  );
}
