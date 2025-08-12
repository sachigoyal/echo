import { Terminal } from 'lucide-react';

export default function CLIAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col py-8 md:py-16 max-w-2xl mx-auto px-2">
      <h1 className="text-3xl font-bold text-card-foreground flex items-center gap-3">
        <Terminal className="w-8 h-8" />
        CLI Authentication
      </h1>
      {children}
    </div>
  );
}
