'use client';

import type { Template as TemplateType } from './types';
import { motion } from 'motion/react';
import { CodeTabs } from '@/components/ui/shadcn-io/code-tabs';
import { api } from '@/trpc/client';
import { toSafePackageName } from '../lib/to-safe-package-name';

interface Props {
  appId: string;
  template: TemplateType;
  index: number;
}

export const Template: React.FC<Props> = ({ template, appId, index }) => {
  const [{ name }] = api.apps.app.get.useSuspenseQuery({ appId });
  const projectName = toSafePackageName(name);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-2 bg-muted p-4"
    >
      <h3 className="text-sm font-bold">
        {index + 1}) Run the {template.title} Creation Script for {name}
      </h3>
      <CodeTabs
        codes={{
          npm: `npx echo-start@latest ${projectName} --template ${template.id} --app-id ${appId}`,
          pnpm: `pnpm dlx echo-start@latest ${projectName} --template ${template.id} --app-id ${appId}`,
          yarn: `yarn dlx echo-start@latest ${projectName} --template ${template.id} --app-id ${appId}`,
          bun: `bunx echo-start@latest ${projectName} --template ${template.id} --app-id ${appId}`,
        }}
        className="border-primary bg-card shadow-[0_0_6px_color-mix(in_oklab,var(--primary)_70%,transparent)]"
      />
    </motion.div>
  );
};
