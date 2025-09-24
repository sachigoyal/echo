import { EchoProvider } from '@merit-systems/echo-react-sdk';
import { ImageGeneration } from './components/ImageGeneration';
import { EchoAccount } from './components/echo-account-react';

function Dashboard() {
  // Main dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-800">
                Image Generator
              </h1>
            </div>

            {/* User info */}
            <div className="flex items-center space-x-4">
              <EchoAccount />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}

        {/* Tab content */}
        <div className="bg-white rounded-lg shadow-sm p-6 min-h-[600px]">
          <ImageGeneration />
        </div>
      </main>
    </div>
  );
}

function App() {
  const baseEchoUrl =
    import.meta.env.VITE_ECHO_URL || 'https://echo.merit.systems';
  const baseRouterUrl =
    import.meta.env.VITE_ROUTER_URL || 'https://echo.router.merit.systems';
  const appId =
    import.meta.env.VITE_ECHO_APP_ID || '46e0ce04-641d-4238-93c9-2482668de9bc';

  return (
    <EchoProvider
      config={{
        appId,
        baseEchoUrl,
        baseRouterUrl,
        redirectUri: window.location.origin,
        scope: 'llm:invoke offline_access',
      }}
    >
      <Dashboard />
    </EchoProvider>
  );
}

export default App;
