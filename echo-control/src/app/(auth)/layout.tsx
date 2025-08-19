import { FlickeringGrid } from '@/components/magicui/flickering-grid';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pt-10 md:pt-[15vh] relative size-full flex flex-col items-center px-2">
      <FlickeringGrid
        className="absolute inset-0 pointer-events-none"
        frameRate={8}
      />
      <div className="max-w-md w-full">{children}</div>
    </div>
  );
}
