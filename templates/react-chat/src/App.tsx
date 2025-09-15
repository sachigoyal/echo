import {
  EchoChatProvider,
  EchoProvider,
  useEchoModelProviders,
} from '@merit-systems/echo-react-sdk';
import { streamText, type ModelMessage } from 'ai';
import Chat from './chat';
import Header from './header';

function App() {
  return (
    <div className={`flex h-screen flex-col antialiased`}>
      <EchoProvider
        config={{
          appId: import.meta.env.VITE_ECHO_APP_ID,
        }}
      >
        <Header title="Echo Chat" />
        <div className="min-h-0 flex-1">
          <ChatWrapper />
        </div>
      </EchoProvider>
    </div>
  );
}

export function ChatWrapper() {
  const { anthropic } = useEchoModelProviders();

  async function doChat({ modelMessages }: { modelMessages: ModelMessage[] }) {
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      messages: modelMessages,
    });
    return result.toUIMessageStream(); // in-memory UI chunk stream
  }

  return (
    <EchoChatProvider chatFn={doChat}>
      <Chat />
    </EchoChatProvider>
  );
}

export default App;
