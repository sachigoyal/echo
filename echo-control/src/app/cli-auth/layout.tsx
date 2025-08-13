import { FlickeringGrid } from '@/components/magicui/flickering-grid';
import { Card } from '@/components/ui/card';
import { Terminal } from 'lucide-react';

export default function CLIAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="size-full relative">
      <FlickeringGrid className="absolute inset-0 -z-1" />
      <div className="flex flex-col py-8 md:py-16 max-w-lg mx-auto px-2 items-center">
        <div className="flex flex-col items-center gap-2">
          <Card className="p-2">
            <Terminal className="size-8" />
          </Card>
          <h1 className="text-2xl font-bold text-card-foreground flex items-center gap-3 text-center">
            CLI Authentication
          </h1>
        </div>
        {children}
      </div>
    </div>
  );
}
