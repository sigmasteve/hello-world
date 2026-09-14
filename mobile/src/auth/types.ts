export type AuthProviderId = 'google' | 'facebook' | 'apple' | 'email';

export interface AuthUser {
  name: string;
  email: string;
  initials: string;
  provider: AuthProviderId;
}

export type AuthStatus = 'signedOut' | 'signedIn';

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
}
