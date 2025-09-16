/**
 * Example TRPC function that demonstrates integration with StatefulDataTable
 * This shows how to create a TRPC procedure that accepts standardized pagination,
 * sorting, and filtering parameters and returns data in the expected format.
 */

import {
  PaginationParams,
  toPaginatedReponse,
} from '@/services/lib/pagination';
import { MultiSortParams } from '@/services/lib/sorting';
import { FilterParams } from '@/services/lib/filtering';

// Example data type
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: Date;
  isActive: boolean;
  loginCount: number;
}

// Mock data generator
const generateMockUsers = (count: number): User[] => {
  const roles: User['role'][] = ['admin', 'user', 'viewer'];
  const names = [
    'Alice Johnson',
    'Bob Smith',
    'Charlie Brown',
    'Diana Prince',
    'Eve Wilson',
    'Frank Miller',
    'Grace Lee',
    'Henry Davis',
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    name: names[i % names.length] || `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: roles[i % roles.length]!,
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date within last year
    isActive: Math.random() > 0.2, // 80% active users
    loginCount: Math.floor(Math.random() * 100),
  }));
};

// Generate mock data
const MOCK_USERS = generateMockUsers(150);

// Helper function to apply sorting
const applySorting = (users: User[], sortParams: MultiSortParams): User[] => {
  if (!sortParams.sorts?.length) return users;

  return [...users].sort((a, b) => {
    // Iterate through each sort criteria in order of priority
    for (const sort of sortParams.sorts!) {
      const aValue = a[sort.column as keyof User];
      const bValue = b[sort.column as keyof User];

      let comparison = 0;

      // Handle different data types appropriately
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        comparison = Number(aValue) - Number(bValue);
      } else {
        // Fallback to string comparison
        comparison = String(aValue).localeCompare(String(bValue));
      }

      // If values are not equal, return the comparison result
      if (comparison !== 0) {
        return sort.direction === 'desc' ? -comparison : comparison;
      }

      // If values are equal, continue to the next sort criteria
    }

    // If all sort criteria result in equal values, maintain original order
    return 0;
  });
};

// Helper function to apply filtering
const applyFiltering = (users: User[], filterParams: FilterParams): User[] => {
  if (!filterParams.filters?.length) return users;

  return users.filter(user => {
    return filterParams.filters!.every(filter => {
      const value = user[filter.column as keyof User];

      // Handle date comparisons
      if (value instanceof Date && filter.value) {
        const filterDate = new Date(filter.value as string | number | Date);

        switch (filter.operator) {
          case 'equals':
            return value.toDateString() === filterDate.toDateString();
          case 'not_equals':
            return value.toDateString() !== filterDate.toDateString();
          case 'greater_than':
            return value.getTime() > filterDate.getTime();
          case 'less_than':
            return value.getTime() < filterDate.getTime();
          case 'greater_than_or_equal':
            return value.getTime() >= filterDate.getTime();
          case 'less_than_or_equal':
            return value.getTime() <= filterDate.getTime();
          case 'is_null':
            return value == null;
          case 'is_not_null':
            return value != null;
          default:
            return true;
        }
      }

      switch (filter.operator) {
        case 'contains':
          return String(value)
            .toLowerCase()
            .includes(String(filter.value).toLowerCase());
        case 'not_contains':
          return !String(value)
            .toLowerCase()
            .includes(String(filter.value).toLowerCase());
        case 'equals':
          return value === filter.value;
        case 'not_equals':
          return value !== filter.value;
        case 'starts_with':
          return String(value)
            .toLowerCase()
            .startsWith(String(filter.value).toLowerCase());
        case 'ends_with':
          return String(value)
            .toLowerCase()
            .endsWith(String(filter.value).toLowerCase());
        case 'greater_than':
          return Number(value) > Number(filter.value);
        case 'less_than':
          return Number(value) < Number(filter.value);
        case 'greater_than_or_equal':
          return Number(value) >= Number(filter.value);
        case 'less_than_or_equal':
          return Number(value) <= Number(filter.value);
        case 'in':
          return (
            Array.isArray(filter.value) &&
            filter.value.includes(value as string | number)
          );
        case 'not_in':
          return (
            Array.isArray(filter.value) &&
            !filter.value.includes(value as string | number)
          );
        case 'is_null':
          return value == null;
        case 'is_not_null':
          return value != null;
        default:
          return true;
      }
    });
  });
};

// Example TRPC procedure function
export const getUsersWithPagination = async (
  params: PaginationParams & MultiSortParams & FilterParams
) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Apply filtering first
  const filteredUsers = applyFiltering(MOCK_USERS, params);

  // Apply sorting
  const sortedUsers = applySorting(filteredUsers, params);

  // Calculate pagination
  const startIndex = params.page * params.page_size;
  const endIndex = startIndex + params.page_size;
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

  // Return in the expected format
  return toPaginatedReponse({
    items: paginatedUsers,
    page: params.page,
    page_size: params.page_size,
    total_count: sortedUsers.length,
  });
};

// Example usage with StatefulDataTable using TRPC:
/*
import { StatefulDataTable } from "@/components/server-side-data-table/StatefulDataTable"
import { api } from "@/trpc/client"
import { User } from "./example-trpc"

// Define columns
const columns: ColumnDef<User, any>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email", 
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ getValue }) => new Date(getValue()).toLocaleDateString(),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ getValue }) => getValue() ? "Active" : "Inactive",
  },
  {
    accessorKey: "loginCount",
    header: "Login Count",
  },
]

// Use in component with TRPC useQuery hook
export function UsersTable() {
  return (
    <StatefulDataTable
      columns={columns}
      trpcQuery={api.admin.users.getUsersWithPagination.useQuery}
    />
  )
}

// Alternative: If you need to pass additional options to the query
export function UsersTableWithOptions() {
  return (
    <StatefulDataTable
      columns={columns}
      trpcQuery={(params) => api.admin.users.getUsersWithPagination.useQuery(params, {
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
      })}
    />
  )
}
*/
