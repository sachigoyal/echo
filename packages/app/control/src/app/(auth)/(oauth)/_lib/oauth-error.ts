export enum OAuthErrorType {
  INVALID_REQUEST = 'invalid_request',
  INVALID_CLIENT = 'invalid_client',
  ACCESS_DENIED = 'access_denied',
  UNSUPPORTED_RESPONSE_TYPE = 'unsupported_response_type',
  INVALID_SCOPE = 'invalid_scope',
  SERVER_ERROR = 'server_error',
  TEMPORARILY_UNAVAILABLE = 'temporarily_unavailable',
  INVALID_GRANT = 'invalid_grant',
  UNSUPPORTED_GRANT_TYPE = 'unsupported_grant_type',
}

export type OAuthErrorBody = {
  error: OAuthErrorType;
  error_description?: string;
};

export class OAuthError extends Error {
  readonly body: OAuthErrorBody;
  constructor(body: OAuthErrorBody) {
    super(body.error);
    this.body = body;
  }
}
