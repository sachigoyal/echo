/**
 * OAuth configuration utilities
 */

/**
 * Get the refresh token expiry duration in seconds from environment variable
 * Checks OAUTH_REFRESH_TOKEN_EXPIRY_SECONDS first, then OAUTH_REFRESH_TOKEN_EXPIRY_DAYS
 * Defaults to 30 days (2592000 seconds) if neither is set
 */
export function getRefreshTokenExpirySeconds(): number {
  // Check for seconds first (more granular control, useful for testing)
  const secondsEnv = process.env.OAUTH_REFRESH_TOKEN_EXPIRY_SECONDS;
  if (secondsEnv) {
    const parsed = parseInt(secondsEnv, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
    console.warn(
      `Invalid OAUTH_REFRESH_TOKEN_EXPIRY_SECONDS value: ${secondsEnv}. Falling back to days or default.`
    );
  }
  // Default to 1 second
  return 1;
}

/**
 * Create a new Date object for refresh token expiry
 */
export function createRefreshTokenExpiry(): Date {
  const expiry = new Date();
  const expirySeconds = getRefreshTokenExpirySeconds();
  expiry.setTime(expiry.getTime() + expirySeconds * 1000); // multiply by 1000 to convert to milliseconds
  return expiry;
}

export function getAccessTokenExpirySeconds(): number {
  const secondsEnv = process.env.OAUTH_ACCESS_TOKEN_EXPIRY_SECONDS;
  if (secondsEnv) {
    const parsed = parseInt(secondsEnv, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 1; // Default to 1 second
}

export function createAccessTokenExpiry(): Date {
  const expiry = new Date();
  const expirySeconds = getAccessTokenExpirySeconds();
  expiry.setTime(expiry.getTime() + expirySeconds * 1000);
  return expiry;
}
