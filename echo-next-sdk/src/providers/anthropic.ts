// import {
//   anthropic,
//   AnthropicProvider,
//   createAnthropic as createAnthropicBase,
// } from '@ai-sdk/anthropic';
import { ROUTER_BASE_URL } from 'config';
import { getEchoToken } from '../auth/token-manager';
// import { AsyncProvider, EchoConfig } from '../types';
import {
  createEchoAnthropic as createEchoAnthropicBase,
  EchoAnthropicProvider,
  EchoConfig,
} from '@merit-systems/echo-typescript-sdk';

// export type EchoAnthropicProvider = AsyncProvider<AnthropicProvider>;

export function createEchoAnthropic({
  appId,
  baseRouterUrl = ROUTER_BASE_URL,
}: EchoConfig): EchoAnthropicProvider {
  return createEchoAnthropicBase({ appId, baseRouterUrl }, async () =>
    getEchoToken(appId)
  );
}

// export function createEchoAnthropic({
//   appId,
//   baseRouterUrl = ROUTER_BASE_URL,
// }: EchoConfig): EchoAnthropicProvider {
//   const getProvider = async () => {
//     const token = await getEchoToken(appId);
//     return createAnthropicBase({
//       baseURL: baseRouterUrl,
//       apiKey: token ?? '', // null will fail auth
//     });
//   };

//   const anthropicFunction = async (modelId: string) => {
//     const provider = await getProvider();
//     return provider(modelId);
//   };

//   const implementation: EchoAnthropicProvider = Object.assign(
//     anthropicFunction,
//     {
//       languageModel: async (modelId: string) => {
//         const provider = await getProvider();
//         return provider.languageModel(modelId);
//       },
//       chat: async (modelId: string) => {
//         const provider = await getProvider();
//         return provider.chat(modelId);
//       },
//       messages: async (modelId: string) => {
//         const provider = await getProvider();
//         return provider.messages(modelId);
//       },
//       // These are from the base provider, unclear if they actually work
//       // (this is just passing on vercel's incomplete types)
//       textEmbeddingModel: async (modelId: string) => {
//         const provider = await getProvider();
//         return provider.textEmbeddingModel(modelId);
//       },
//       imageModel: async (modelId: string) => {
//         const provider = await getProvider();
//         return provider.imageModel(modelId);
//       },
//       tools: anthropic.tools,
//     }
//   );

//   return implementation;
// }
