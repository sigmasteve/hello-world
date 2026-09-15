import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';
import { initialsFor } from './initials';
import type { AuthProviderId, AuthUser, SignUpInput } from './types';

// Used instead of mockAuth.ts whenever a Supabase project is configured
// (see src/lib/supabase.ts / AuthContext.tsx). Every export here matches
// mockAuth.ts's signature so AuthContext.tsx and every screen are
// unaffected by which one is active.

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

// `profiles` is populated by a DB trigger on signup (see
// supabase/migrations/0001_challenges_schema.sql), so this is the one
// place that turns "a Supabase auth user" into the AuthUser shape the rest
// of the app renders.
export async function userFromSession(session: Session, provider: AuthProviderId = 'email'): Promise<AuthUser> {
  const client = requireClient();
  const fallbackEmail = session.user.email ?? '';
  const { data } = await client.from('profiles').select('name, initials, email').eq('id', session.user.id).single();
  if (!data) {
    // The trigger runs in the same transaction as the auth.users insert,
    // so this really only happens if it hasn't landed yet (rare, but
    // possible right after a signUp response) — fall back to what the
    // session itself already knows rather than surfacing an error here.
    const name = fallbackEmail.split('@')[0] || 'Hound user';
    return { name, email: fallbackEmail, initials: initialsFor(name), provider };
  }
  return { name: data.name, email: data.email, initials: data.initials, provider };
}

export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  const client = requireClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return userFromSession(data.session, 'email');
}

export async function signUpWithEmail({ name, email, password }: SignUpInput): Promise<AuthUser> {
  const client = requireClient();
  const { data, error } = await client.auth.signUp({ email, password, options: { data: { name } } });
  if (error) throw new Error(error.message);
  if (!data.session) {
    // Email confirmation is on for this project — there's no session yet,
    // so there's nothing to sign the user into until they confirm and log
    // in for real.
    throw new Error('Check your email to confirm your account, then log in.');
  }
  return userFromSession(data.session, 'email');
}

// Supabase's provider ids line up with ours except Apple stays 'apple' —
// spelled out for clarity at the one place that has to know it.
const SUPABASE_PROVIDER: Record<Exclude<AuthProviderId, 'email'>, 'google' | 'facebook' | 'apple'> = {
  google: 'google',
  facebook: 'facebook',
  apple: 'apple',
};

export async function signInWithProvider(provider: Exclude<AuthProviderId, 'email'>): Promise<AuthUser> {
  const client = requireClient();
  const redirectTo = Linking.createURL('auth/callback');
  const { data, error } = await client.auth.signInWithOAuth({
    provider: SUPABASE_PROVIDER[provider],
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw new Error(error.message);
  if (!data.url) throw new Error('Could not start sign-in.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') throw new Error('Sign-in was cancelled.');

  // Supabase's OAuth redirect carries the session in the URL fragment
  // (#access_token=...), not the query string, so URLSearchParams needs
  // the hash handed to it directly.
  const hash = result.url.split('#')[1] ?? '';
  const params = new URLSearchParams(hash);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) {
    throw new Error(
      params.get('error_description') ?? 'Sign-in did not return a session — is this provider enabled in Supabase?',
    );
  }

  const { data: sessionData, error: sessionError } = await client.auth.setSession({ access_token, refresh_token });
  if (sessionError || !sessionData.session) throw new Error(sessionError?.message ?? 'Sign-in failed.');
  return userFromSession(sessionData.session, provider);
}

export async function signOut(): Promise<void> {
  const client = requireClient();
  const { error } = await client.auth.signOut();
  if (error) throw new Error(error.message);
}
