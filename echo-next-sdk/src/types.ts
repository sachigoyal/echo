import { NextRequest } from 'next/server';
import { EchoAnthropicProvider } from 'providers';
import { EchoOpenAIProvider } from 'providers/openai';

export interface EchoConfig {
  appId: string;
  basePath?: string;
}

// We went pretty ham here just so that we can generically construct the provider
export type AsyncProvider<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => Promise<R>
    : T[K];
} & (T extends (...args: infer A) => infer R ? (...args: A) => Promise<R> : {});

export type AppRouteHandlers = Record<
  'GET' | 'POST',
  (req: NextRequest) => Promise<Response>
>;

export type EchoResult = {
  handlers: AppRouteHandlers;
  isSignedIn: () => Promise<boolean>;
  getEchoToken: () => Promise<string | null>;
  openai: EchoOpenAIProvider;
  anthropic: EchoAnthropicProvider;
};
