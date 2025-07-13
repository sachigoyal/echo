import { AppRole, Permission } from '@/lib/permissions/types';

/**
 * Represents the public-facing details of an Echo App.
 * This type is used for anonymous or general app listings.
 */
export interface PublicEchoApp {
  id: string;
  name: string;
  description: string | null;
  profilePictureUrl: string | null;
  bannerImageUrl: string | null;
  isActive: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  totalTokens: number;
  totalCost: number;
  githubId: string | null;
  githubType: string | null;
  authorizedCallbackUrls: string[];
  _count: {
    apiKeys: number;
    llmTransactions: number;
  };
  owner: {
    id: string;
    email: string;
    name: string | null;
    profilePictureUrl: string | null;
  };
  activityData: number[];
}

/**
 * Extends PublicEchoApp with user-specific details.
 * This type is used when a user is authenticated and their relationship
 * with the app (e.g., role and permissions) is known.
 */
export interface AuthenticatedEchoApp extends PublicEchoApp {
  userRole: AppRole;
  permissions: Permission[];
}

/**
 * A union type representing any shape of an Echo App.
 * Useful for components that can handle both public and authenticated app data.
 */
export type EchoApp = PublicEchoApp | AuthenticatedEchoApp;

export interface AppActivity {
  timestamp: Date;
  totalCost: number;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
}
