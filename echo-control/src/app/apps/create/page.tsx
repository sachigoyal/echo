import { FlickeringGrid } from '@/components/magicui/flickering-grid';
import { Card } from '@/components/ui/card';

import { Logo } from '@/components/ui/logo';
import { CreateAppForm } from './_components/form';

export default function CreateAppPage() {
  return (
    <div className="relative size-full flex flex-col items-center justify-center pb-12 md:pb-16 gap-4">
      <FlickeringGrid
        className="absolute inset-0 pointer-events-none"
        frameRate={4}
      />

      <div className="w-full max-w-md flex flex-col items-center justify-center gap-8">
        <div className="flex flex-col items-center justify-center gap-2">
          <Card className="z-10 size-16 overflow-hidden rounded-md p-2">
            <Logo className="size-12" />
          </Card>
          <h1 className="text-3xl font-bold text-foreground">Create an App</h1>
        </div>
        <div className="flex flex-col items-center gap-4 w-full">
          <Card className="bg-card rounded-lg border border-border shadow-lg w-full p-4">
            <CreateAppForm />
          </Card>
        </div>
      </div>
    </div>
  );
}
