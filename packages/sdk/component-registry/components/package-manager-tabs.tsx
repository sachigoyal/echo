'use client';

import { Button } from '@/registry/echo/ui/echo-button';
import { useState } from 'react';
import { CopyCommand } from './copy-command';

const REGISTRY_HOMEPAGE =
  process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';

const PACKAGE_MANAGERS = [
  {
    id: 'pnpm',
    label: 'pnpm',
    command: `pnpm dlx shadcn@latest add ${REGISTRY_HOMEPAGE}/`,
  },
  {
    id: 'npm',
    label: 'npm',
    command: `npx shadcn@latest add ${REGISTRY_HOMEPAGE}/`,
  },
  {
    id: 'yarn',
    label: 'yarn',
    command: `yarn dlx shadcn@latest add ${REGISTRY_HOMEPAGE}/`,
  },
  {
    id: 'bun',
    label: 'bun',
    command: `bunx shadcn@latest add ${REGISTRY_HOMEPAGE}/`,
  },
] as const;

export function PackageManagerTabs({
  componentName,
}: {
  componentName: string;
}) {
  const [activeTab, setActiveTab] = useState<string>(PACKAGE_MANAGERS[0].id);

  const activeCommand = PACKAGE_MANAGERS.find(
    pm => pm.id === activeTab
  )?.command;

  return (
    <div className="flex flex-col gap-2">
      <div className="inline-flex p-1 bg-muted rounded-md">
        {PACKAGE_MANAGERS.map(pm => (
          <Button
            key={pm.id}
            variant={activeTab === pm.id ? 'secondary' : 'ghost'}
            className="text-sm px-3"
            onClick={() => setActiveTab(pm.id)}
          >
            {pm.label}
          </Button>
        ))}
      </div>
      {activeCommand && (
        <CopyCommand command={`${activeCommand}${componentName}.json`} />
      )}
    </div>
  );
}
