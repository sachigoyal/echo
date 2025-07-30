import ChatProvider from '@/components/chat';

export default function ChatPage() {
  return (
    <main className="container">
      <h1>Echo Chat</h1>
      <ChatProvider />
    </main>
  );
}
