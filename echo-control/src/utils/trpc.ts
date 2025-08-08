import { createTRPCReact } from '@trpc/react-query';
import { type AppRouter } from '@/trpc/routers';

/**
 * A set of type-safe react query hooks for your tRPC API.
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Inference helper for inputs.
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

// Import these types from @trpc/server
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
