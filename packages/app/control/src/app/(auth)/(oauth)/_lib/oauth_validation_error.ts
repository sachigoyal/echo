import { OAuthErrorBody } from './oauth-error';

export const oauthValidationError = (error: OAuthErrorBody) =>
  JSON.stringify(error);
