export interface EchoClientConfig {
  basePath?: string;
}

/**
 * Sign in to Echo (client-side only)
 */
export function signIn(config?: EchoClientConfig) {
  if (typeof window === 'undefined') {
    console.warn('signIn() can only be called in client components');
    return;
  }

  const basePath = config?.basePath || '/api/echo';
  window.location.href = `${window.location.origin}${basePath}/signin`;
}

export function refreshToken(config?: EchoClientConfig) {
  if (typeof window === 'undefined') {
    console.warn('refreshToken() can only be called in client components');
    return;
  }

  const basePath = config?.basePath || '/api/echo';
  window.location.href = `${window.location.origin}${basePath}/refresh`;
}
