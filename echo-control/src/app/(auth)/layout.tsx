import { FlickeringGrid } from '@/components/magicui/flickering-grid';

export default async function AuthLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="pt-10 md:pt-[15vh] relative min-h-screen flex flex-col items-center px-2 flex-1">
      <FlickeringGrid
        className="absolute inset-0 pointer-events-none -z-1"
        frameRate={8}
      />
      <div className="max-w-md w-full">{children}</div>
    </div>
  );
}
