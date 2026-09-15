export type AuthProviderId = 'google' | 'facebook' | 'apple' | 'email';

export interface AuthUser {
  // The real Supabase auth.users id when signed in via supabaseAuth.ts —
  // src/challenges/present.ts needs this to tell "me" apart from other
  // participants. mockAuth.ts sets a placeholder since nothing real
  // reads challenge data on that path (isSupabaseConfigured gates it).
  id: string;
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
