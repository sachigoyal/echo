import { NextRequest } from 'next/server';

export interface EchoConfig {
  appId: string;
  basePath?: string;
}

export type AppRouteHandlers = Record<
  'GET' | 'POST',
  (req: NextRequest) => Promise<Response>
>;

export type EchoResult = {
  handlers: AppRouteHandlers;
  isSignedIn: () => Promise<boolean>;
  getEchoToken: () => Promise<string | null>;
  baseUrl: string;
};
