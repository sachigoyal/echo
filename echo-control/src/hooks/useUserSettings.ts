import { useState, useEffect, useCallback } from 'react';

interface AppUser {
  id: string;
  userId: string;
  email: string;
  name?: string;
  profilePictureUrl?: string;
  role: string;
  status: string;
  totalSpent: number;
  apiKeyCount: number;
  transactionSpent: number;
  joinedAt: string;
  userCreatedAt: string;
}

interface UsersPaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface UsersResponse {
  users: AppUser[];
  pagination: UsersPaginationInfo;
}

interface UseUserSettingsReturn {
  users: AppUser[];
  loading: boolean;
  error: string | null;
  pagination: UsersPaginationInfo | null;
  fetchUsers: (page?: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useUserSettings(appId: string): UseUserSettingsReturn {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UsersPaginationInfo | null>(
    null
  );

  const fetchUsers = useCallback(
    async (page: number = 1) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/owner/apps/${appId}/users?page=${page}&limit=10`
        );

        if (response.ok) {
          const data: UsersResponse = await response.json();
          setUsers(data.users);
          setPagination(data.pagination);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch users');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to load users'
        );
      } finally {
        setLoading(false);
      }
    },
    [appId]
  );

  const refresh = useCallback(async () => {
    const currentPage = pagination?.page || 1;
    await fetchUsers(currentPage);
  }, [fetchUsers, pagination?.page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    pagination,
    fetchUsers,
    refresh,
  };
}

export type { AppUser, UsersPaginationInfo, UsersResponse };
