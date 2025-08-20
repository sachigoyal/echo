import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  exp?: number;
}

/**
 * Check if a JWT token needs to be refreshed
 * @param token - The JWT access token to check
 * @returns true if token should be refreshed, false otherwise
 */
export function shouldRefreshToken(token: string): boolean {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    if (!decoded.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    // Refresh if token expires within 30 seconds
    const bufferTime = 30;
    return decoded.exp <= now + bufferTime;
  } catch {
    return true; // If we can't decode, assume it needs refresh
  }
}

/**
 * Decode a JWT token safely
 * @param token - The JWT token to decode
 * @returns Decoded payload or null if invalid
 */
export function decodeToken<T = JwtPayload>(token: string): T | null {
  try {
    return jwtDecode<T>(token);
  } catch {
    return null;
  }
}

/**
 * Check if a JWT token is expired
 * @param token - The JWT token to check
 * @returns true if expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !('exp' in decoded)) return true;

  const now = Math.floor(Date.now() / 1000);
  return (decoded as JwtPayload).exp! <= now;
}
