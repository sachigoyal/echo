/**
 * Core app types from the backend
 * These are the only types needed - everything else flows from these
 */
import type {
  PublicEchoApp,
  CustomerEchoApp,
  OwnerEchoApp,
} from '@/lib/apps/types';

export { type CustomerEchoApp, type OwnerEchoApp } from '@/lib/apps/types';

/**
 * Union type for any app - components should use this
 * and check the 'type' discriminator when needed
 */
export type EchoApp = PublicEchoApp | CustomerEchoApp | OwnerEchoApp;
