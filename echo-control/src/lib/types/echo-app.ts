import { AppRole } from '@/lib/permissions/types';

export interface EchoApp {
  id: string;
  name: string;
  description?: string;
  profilePictureUrl?: string;
  bannerImageUrl?: string;
  isActive: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  totalTokens: number;
  totalCost: number;
  userRole?: AppRole;
  permissions?: unknown;
  _count: {
    apiKeys: number;
    llmTransactions: number;
  };
  owner: {
    id: string;
    email: string;
    name?: string;
    profilePictureUrl?: string;
  };
}
