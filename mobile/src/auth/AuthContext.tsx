import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import * as mockAuth from './mockAuth';
import type { AuthStatus, AuthUser, SignUpInput } from './types';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (input: SignUpInput) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  // Every method here re-throws whatever mockAuth rejects with, so screens
  // can show it directly (`err.message`) — this context adds no error
  // translation of its own, matching how a real auth SDK's errors would
  // reach the UI unmodified.
  const signInWithGoogle = useCallback(async () => setUser(await mockAuth.signInWithProvider('google')), []);
  const signInWithFacebook = useCallback(async () => setUser(await mockAuth.signInWithProvider('facebook')), []);
  const signInWithApple = useCallback(async () => setUser(await mockAuth.signInWithProvider('apple')), []);
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setUser(await mockAuth.signInWithEmail(email, password));
  }, []);
  const signUpWithEmail = useCallback(async (input: SignUpInput) => {
    setUser(await mockAuth.signUpWithEmail(input));
  }, []);
  const signOut = useCallback(() => setUser(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: user ? 'signedIn' : 'signedOut',
      user,
      signInWithGoogle,
      signInWithFacebook,
      signInWithApple,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    }),
    [user, signInWithGoogle, signInWithFacebook, signInWithApple, signInWithEmail, signUpWithEmail, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() must be called within an AuthProvider');
  return ctx;
}
