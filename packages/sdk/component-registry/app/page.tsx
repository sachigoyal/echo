// This page displays items from the custom registry.
// You are free to implement this with your own design as needed.

import { PackageManagerTabs } from '@/components/package-manager-tabs';
import { EchoAccount } from '@/registry/echo/blocks/echo-account-button/echo-account-next';

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto flex flex-col min-h-svh px-4 py-8 gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Echo Component Registry
        </h1>
        <p className="text-muted-foreground">
          A registry for distributing Echo components.
        </p>
      </header>
      <main className="flex flex-col flex-1 gap-8">
        <div className="flex flex-col gap-4 border rounded-lg p-4 min-h-[450px] relative">
          <div className="flex items-center justify-between">
            <h2 className="text-sm text-muted-foreground sm:pl-3">
              Echo Account Button
            </h2>
          </div>
          <div className="flex items-center justify-center min-h-[400px] relative">
            <EchoAccount />
          </div>
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-2">
              Use in your Next.js app
            </h3>
            <PackageManagerTabs componentName="echo-account-next" />
          </div>
        </div>
      </main>
    </div>
  );
}
