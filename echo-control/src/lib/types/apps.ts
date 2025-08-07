/**
 * Core app types from the backend
 * These are the only types needed - everything else flows from these
 */
import type {
  PublicEchoApp,
  CustomerEchoApp,
  OwnerEchoApp,
} from '@/lib/apps/types';

export {
  type PublicEchoApp,
  type CustomerEchoApp,
  type OwnerEchoApp,
  type AppActivity,
  type ModelUsage,
  type GlobalStatistics,
  type CustomerStatistics,
  type OwnerStatistics,
  type Owner,
} from '@/lib/apps/types';

/**
 * Union type for any app - components should use this
 * and check the 'type' discriminator when needed
 */
export type EchoApp = PublicEchoApp | CustomerEchoApp | OwnerEchoApp;
