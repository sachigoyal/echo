import { OAuth2Config, OIDCConfig } from 'next-auth/providers';

export type OAuthProvider = OAuth2Config<any> | OIDCConfig<any>;
