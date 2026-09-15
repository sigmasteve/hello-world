import { Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Native Google Sign-In (the real account picker), not the generic
// web-OAuth redirect the Facebook/Apple buttons use — see
// mobile/README.md "Google Sign-In (native)" for why Google specifically
// gets this treatment and what it needs in Google Cloud Console.
//
// `webClientId` is a "Web application" OAuth client from Google Cloud
// Console — required even though nothing web-based is happening here,
// because it's what audiences the ID token Google issues, and Supabase's
// signInWithIdToken verifies that audience against the same client ID
// configured in its own dashboard. It's not a secret (it's compiled into
// the app bundle either way); the corresponding client *secret* only ever
// goes into the Supabase dashboard, never into this app.
const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export const isGoogleSignInConfigured = Boolean(webClientId);

let configured = false;
function ensureConfigured(): void {
  if (configured) return;
  if (!webClientId) {
    throw new Error('Google Sign-In needs EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID set — see mobile/README.md.');
  }
  GoogleSignin.configure({ webClientId, scopes: ['email', 'profile'] });
  configured = true;
}

// Returns the Google ID token for supabaseAuth.ts to hand to
// supabase.auth.signInWithIdToken. Never returns without one — every
// non-token outcome (cancelled, no Play Services, not configured, web)
// throws a message a screen can show directly.
export async function signInWithGoogleNative(): Promise<string> {
  if (Platform.OS === 'web') {
    // The free build of this package has no web implementation at all
    // (it throws its own, sponsor-upsell error) — same "not on this
    // platform" story as HealthKit/Health Connect not being in Expo Go,
    // just worth a clearer message here since it'd otherwise be the only
    // provider button that behaves differently on web for a
    // package-specific reason rather than a "no native module" reason.
    throw new Error('Google Sign-In isn’t available in the web preview — run a native build to use it.');
  }
  ensureConfigured();
  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }
  const response = await GoogleSignin.signIn();
  if (response.type === 'cancelled') {
    throw new Error('Sign-in was cancelled.');
  }
  const idToken = response.data.idToken;
  if (!idToken) {
    throw new Error('Google did not return an ID token.');
  }
  return idToken;
}

// Best-effort: clears the native Google session too, so the account
// picker doesn't silently re-offer the same account next time. Swallows
// everything — "never configured" or "wasn't signed in via Google" are
// both fine outcomes when signing out, not errors worth surfacing.
export async function signOutGoogleNative(): Promise<void> {
  if (Platform.OS === 'web' || !configured) return;
  try {
    await GoogleSignin.signOut();
  } catch {
    // See above.
  }
}
