import type { AuthProviderId, AuthUser, SignUpInput } from './types';

// Stands in for a real identity backend (Firebase Auth, Auth0, a custom
// API — whatever gets picked later). Every method here has the exact shape
// a real one would (async, can reject with a user-facing message), so
// swapping this module out is the only change AuthContext.tsx should ever
// need. See mobile/README.md for what's mocked vs real.

function delay<T>(value: T, ms = 700): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'H';
}

const PROVIDER_PROFILE: Record<Exclude<AuthProviderId, 'email'>, AuthUser> = {
  google: { name: 'Jordan Lee', email: 'jordan.lee@gmail.com', initials: 'JL', provider: 'google' },
  facebook: { name: 'Jordan Lee', email: 'jordan.lee@fb.example', initials: 'JL', provider: 'facebook' },
  apple: { name: 'Jordan Lee', email: 'jordan.lee@icloud.com', initials: 'JL', provider: 'apple' },
};

// A couple of emails a demo can bump into on purpose, so the error states
// (wrong password, email already registered) are actually reachable
// without a real backend to reject them.
const KNOWN_ACCOUNT = { email: 'jordan.lee@gmail.com', password: 'hound123' };

export async function signInWithProvider(provider: Exclude<AuthProviderId, 'email'>): Promise<AuthUser> {
  return delay(PROVIDER_PROFILE[provider], 900);
}

export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  await delay(undefined, 700);
  const normalized = email.trim().toLowerCase();
  if (normalized === KNOWN_ACCOUNT.email && password !== KNOWN_ACCOUNT.password) {
    throw new Error('Incorrect email or password.');
  }
  if (normalized !== KNOWN_ACCOUNT.email && password.length < 6) {
    // No real account exists to check against — mirror the one validation
    // a real backend would still reject on: too-short passwords never
    // match anything.
    throw new Error('Incorrect email or password.');
  }
  const name = normalized === KNOWN_ACCOUNT.email ? 'Jordan Lee' : email.split('@')[0];
  return { name, email, initials: initialsFor(name), provider: 'email' };
}

export async function signUpWithEmail({ name, email, password }: SignUpInput): Promise<AuthUser> {
  await delay(undefined, 700);
  if (email.trim().toLowerCase() === KNOWN_ACCOUNT.email) {
    throw new Error('An account already exists for this email.');
  }
  return { name, email, initials: initialsFor(name), provider: 'email' };
}
