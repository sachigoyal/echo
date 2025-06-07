import React from 'react';
import { EchoSignInProps } from '../types';
import { useEcho } from '../hooks/useEcho';

export function EchoSignIn({
  onSuccess,
  onError,
  className = '',
  children,
}: EchoSignInProps) {
  const { signIn, isAuthenticated, isLoading, user, error } = useEcho();

  React.useEffect(() => {
    if (isAuthenticated && user && onSuccess) {
      onSuccess(user);
    }
  }, [isAuthenticated, user, onSuccess]);

  React.useEffect(() => {
    if (error && onError) {
      onError(new Error(error));
    }
  }, [error, onError]);

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (err) {
      if (onError) {
        onError(err instanceof Error ? err : new Error('Sign in failed'));
      }
    }
  };

  if (isAuthenticated) {
    return (
      <div className={`echo-signin-success ${className}`}>
        <div>Welcome, {user?.name || user?.email}!</div>
      </div>
    );
  }

  return (
    <div className={`echo-signin ${className}`}>
      {children ? (
        <div onClick={handleSignIn} style={{ cursor: 'pointer' }}>
          {children}
        </div>
      ) : (
        <button
          onClick={handleSignIn}
          disabled={isLoading}
          className="echo-signin-button"
          style={{
            padding: '12px 24px',
            backgroundColor: '#cd1b21',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? 'Signing in...' : 'Sign in with Echo'}
        </button>
      )}

      {error && (
        <div
          className="echo-signin-error"
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
