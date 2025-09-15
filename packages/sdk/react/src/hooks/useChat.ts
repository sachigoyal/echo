import { useChat as useChatBase } from '@ai-sdk/react';
import { type ChatTransport, type UIMessage } from 'ai';
import {
  ChatSendParams,
  useEchoChatConfig,
} from '../components/EchoChatProvider';

function createInMemoryChatTransport(): ChatTransport<UIMessage> {
  const chatFn = useEchoChatConfig();
  return {
    sendMessages: async options => {
      console.log('sendMessages', options);
      return chatFn(options as ChatSendParams);
    },
    async reconnectToStream() {
      return null;
    },
  };
}

export function useChat() {
  const transport = createInMemoryChatTransport();
  return useChatBase({ transport });
}
