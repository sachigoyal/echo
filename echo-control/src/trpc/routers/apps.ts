import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  getApp,
  getAllPublicEchoApps,
  getAllCustomerEchoApps,
  getAllOwnerEchoApps,
  getPublicEchoApp,
  getCustomerEchoApp,
  getOwnerEchoApp,
} from '@/lib/apps';
import { AppRole } from '@/lib/permissions/types';
import { PermissionService } from '@/lib/permissions';

export const appsRouter = createTRPCRouter({
  /**
   * Get a single app with appropriate permissions
   * Returns different data based on user's role:
   * - Owner: Full app details with management data
   * - Customer: App details with customer statistics
   * - Public: Basic app details with global statistics
   */
  getApp: publicProcedure
    .input(
      z.object({
        appId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const app = await getApp(input.appId, ctx.session?.user?.id);
        return app;
      } catch (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: error instanceof Error ? error.message : 'App not found',
        });
      }
    }),

  /**
   * Get a specific app as owner (requires owner permissions)
   */
  getOwnerApp: protectedProcedure
    .input(
      z.object({
        appId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Check if user is owner
      const role = await PermissionService.getUserAppRole(
        ctx.session.user.id,
        input.appId
      );
      if (role !== AppRole.OWNER) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have owner permissions for this app',
        });
      }

      return getOwnerEchoApp(input.appId, ctx.session.user.id);
    }),

  /**
   * Get a specific app as customer (requires customer permissions)
   */
  getCustomerApp: protectedProcedure
    .input(
      z.object({
        appId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Check if user has at least customer access
      const role = await PermissionService.getUserAppRole(
        ctx.session.user.id,
        input.appId
      );
      if (role === AppRole.PUBLIC || !role) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have customer permissions for this app',
        });
      }

      return getCustomerEchoApp(input.appId, ctx.session.user.id);
    }),

  /**
   * Get a specific app's public information
   */
  getPublicApp: publicProcedure
    .input(
      z.object({
        appId: z.uuid(),
      })
    )
    .query(async ({ input }) => {
      return getPublicEchoApp(input.appId);
    }),

  /**
   * Get all public apps with pagination
   */
  getAllPublicApps: publicProcedure
    .input(
      z
        .object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(10),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 10;
      const search = input?.search;

      const apps = await getAllPublicEchoApps();

      // Apply search filter if provided
      let filteredApps = apps;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredApps = apps.filter(
          app =>
            app.name.toLowerCase().includes(searchLower) ||
            app.description?.toLowerCase().includes(searchLower)
        );
      }

      // Calculate pagination
      const totalCount = filteredApps.length;
      const totalPages = Math.ceil(totalCount / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedApps = filteredApps.slice(startIndex, endIndex);

      return {
        apps: paginatedApps,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    }),

  /**
   * Get all apps where the user is a customer
   */
  getAllCustomerApps: protectedProcedure
    .input(
      z
        .object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(10),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 10;
      const search = input?.search;

      const apps = await getAllCustomerEchoApps(ctx.session.user.id);

      // Apply search filter if provided
      let filteredApps = apps;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredApps = apps.filter(
          app =>
            app.name.toLowerCase().includes(searchLower) ||
            app.description?.toLowerCase().includes(searchLower)
        );
      }

      // Calculate pagination
      const totalCount = filteredApps.length;
      const totalPages = Math.ceil(totalCount / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedApps = filteredApps.slice(startIndex, endIndex);

      return {
        apps: paginatedApps,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    }),

  /**
   * Get all apps where the user is the owner
   */
  getAllOwnerApps: protectedProcedure
    .input(
      z
        .object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(10),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 10;
      const search = input?.search;

      const apps = await getAllOwnerEchoApps(ctx.session.user.id);

      // Apply search filter if provided
      let filteredApps = apps;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredApps = apps.filter(
          app =>
            app.name.toLowerCase().includes(searchLower) ||
            app.description?.toLowerCase().includes(searchLower)
        );
      }

      // Calculate pagination
      const totalCount = filteredApps.length;
      const totalPages = Math.ceil(totalCount / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedApps = filteredApps.slice(startIndex, endIndex);

      return {
        apps: paginatedApps,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    }),
});
