'use client';

import { Thread } from '@/components/assistant-ui/thread';
import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { useChatRuntime } from '@assistant-ui/react-ai-sdk';
import { Header } from '@/components/header';
import { BalanceProvider, useBalance } from '@/components/balance-provider';

function ChatApp() {
  const { refreshBalance } = useBalance();

  // Using the new simplified useChatRuntime hook
  const runtime = useChatRuntime({
    onFinish: () => {
      // Refresh balance when message completes
      refreshBalance();
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="h-full flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 min-h-0">
          <Thread />
        </main>
      </div>
    </AssistantRuntimeProvider>
  );
}

export default function Home() {
  return (
    <BalanceProvider>
      <ChatApp />
    </BalanceProvider>
  );
}
