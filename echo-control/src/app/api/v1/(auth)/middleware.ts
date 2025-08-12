import { MiddlewareFunction } from '../../_utils/types';

// Create a middleware that checks permissions
const permissionCheckMiddleware: MiddlewareFunction = async ({
  next,
  metadata,
  request,
}) => {
  // Get user permissions from auth header, token, or session
  const userPermissions = getUserPermissions(request);

  // If no required permissions in metadata, allow access
  if (
    !metadata?.requiredPermissions ||
    metadata.requiredPermissions.length === 0
  ) {
    return next({ context: { authorized: true } });
  }

  // Check if user has all required permissions
  const hasAllPermissions = metadata.requiredPermissions.every(permission =>
    userPermissions.includes(permission)
  );

  if (!hasAllPermissions) {
    // Short-circuit with 403 Forbidden response
    return new Response(
      JSON.stringify({
        error: 'Forbidden',
        message: 'You do not have the required permissions',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Continue with authorized context
  return next({ context: { authorized: true } });
};
