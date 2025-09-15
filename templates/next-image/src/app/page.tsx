import { isSignedIn } from '@/echo';
import SignIn from '@/components/signin';
import ImageGenerator from '@/components/image-generator';
import { EchoWidget } from '@/components/echo-tokens';

export default async function Home() {
  const _isSignedIn = await isSignedIn();

  if (!_isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <SignIn />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen p-4 max-w-6xl mx-auto">
      <header className="flex justify-between items-center w-full mb-8 p-6 bg-gradient-to-r from-slate-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-mono bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Echo Image Gen
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <EchoWidget />
        </div>
      </header>

      <ImageGenerator />
    </div>
  );
}
