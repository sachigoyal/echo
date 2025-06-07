import {
  EchoProvider,
  EchoSignIn,
  EchoTokenPurchase,
  useEcho,
} from '@echo-systems/react-sdk';

function Dashboard() {
  const { isAuthenticated, user, balance } = useEcho();

  // Not signed in - show sign in button
  if (!isAuthenticated) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '20px',
        }}
      >
        <h1>Welcome to Echo Example</h1>
        <EchoSignIn />
      </div>
    );
  }

  // Signed in but no balance - show token purchase
  if (balance?.credits === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '20px',
        }}
      >
        <h1>Hi {user?.name}!</h1>
        <p>You need tokens to get started.</p>
        <EchoTokenPurchase amount={100} />
      </div>
    );
  }

  // Signed in with balance - success!
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '20px',
      }}
    >
      <h1>🎉 Success!</h1>
      <p>Welcome {user?.name}!</p>
      <p>
        You have {balance?.credits} {balance?.currency}
      </p>
    </div>
  );
}

function App() {
  return (
    <EchoProvider
      config={{
        instanceId: 'demo-echo-instance-id',
        apiUrl: 'http://localhost:3000',
      }}
    >
      <Dashboard />
    </EchoProvider>
  );
}

export default App;
