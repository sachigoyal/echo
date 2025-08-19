import { Logo } from '@/components/ui/logo';

import { CreateAppForm } from './_components/form';

export default function CreateAppPage() {
  return (
    <div className="relative w-full min-h-full flex flex-col items-center py-8 md:py-12 gap-4 px-2">
      <div className="w-full max-w-md flex flex-col items-center justify-center gap-4 md:gap-8">
        <div className="flex flex-col items-center justify-center gap-1 md:gap-2">
          <Logo className="size-12 md:size-16" priority />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Create an App
          </h1>
        </div>
        <div className="flex flex-col items-center gap-4 w-full">
          <CreateAppForm />
          <p className="text-muted-foreground text-xs text-center">
            Your app configuration can always be changed from the settings page.
          </p>
        </div>
      </div>
    </div>
  );
}
