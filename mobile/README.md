# Hound (mobile)

Cross-platform iOS/Android rebuild of Hound — a friend-challenge fitness app
(step races, streaks, and a GPS-distance "Hunter & Hunted" chase) that reads
real step/distance/heart-rate/weight data from **Apple HealthKit** on iOS and
**Health Connect** on Android.

Built with Expo (React Native + TypeScript). The visual design (colors,
type, spacing, card/button language) is ported from the original static-web
prototype at the repo root — see `../styles.css` for the source tokens,
mirrored in `src/theme/tokens.ts`.

## Why a rewrite, not a wrapper

The original prototype was plain HTML/CSS/JS. HealthKit and Health Connect
have no web API at all — they're native-only (Swift/Kotlin), so a browser
build fundamentally cannot read them. This app is a from-scratch React
Native rebuild for that reason, following the same look and information
architecture as the original.

## Project layout

```
src/
  theme/        design tokens ported from the web app's CSS variables
  components/   shared UI primitives (Button, Card, Tag, Avatar, TextField, …)
  navigation/   React Navigation stack — gates on auth status (see below),
                then Main (tab-style content switcher, matching the web's
                persistent top nav) + Hunt/Create as pushed detail screens
  screens/      one file per screen (Home, Hunt, Challenges, Create wizard,
                Metrics, Friends, Settings, Connect)
  screens/auth/ Welcome, Login, SignUp screens (see "The auth layer")
  auth/         the sign-in abstraction (see below)
  health/       the HealthKit/Health Connect abstraction (see below)
  challenges/   the challenge/competition data-access layer (see "The
                backend (Supabase)")
  lib/          third-party client setup — currently just supabase.ts
  data/         sample data for the social layer (challenges, friends) —
                still what most screens render; see "What's not implemented"
supabase/
  migrations/   SQL to run against your own Supabase project — nothing in
                this repo runs it for you, see "The backend (Supabase)"
```

## The backend (Supabase)

Challenge/competition data (challenges, who's in them, daily progress) and
real sign-in both live in a [Supabase](https://supabase.com) project —
Postgres, auth, and realtime behind one client library, chosen so the app
doesn't need a server of its own. **No project is included** — you point
the app at your own:

1. Create a free project at [supabase.com](https://supabase.com).
2. Project Settings → API: copy the **Project URL** and **anon public**
   key.
3. `cp .env.example .env` in `mobile/` and paste them in as
   `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Expo
   inlines `EXPO_PUBLIC_*` vars into the JS bundle at build/start time —
   restart `expo start` after editing `.env`, since it's only read once at
   startup.
4. SQL Editor → New query → paste in
   `supabase/migrations/0001_challenges_schema.sql` → Run. This creates
   `profiles`, `challenges`, `challenge_participants`, and
   `progress_snapshots`, all with Row Level Security policies scoping each
   table to "am I a participant of this challenge" — see the comments in
   that file for the exact policies.

With those two env vars unset (the default — nothing above is required to
run the app), everything falls back to what it did before: mock auth
(`src/auth/mockAuth.ts`) and static sample data. This is the same
fallback pattern `src/health` uses for a native module that isn't linked —
`isSupabaseConfigured` (`src/lib/supabase.ts`) is the single switch every
caller checks.

**Email/password auth is fully wired** (`src/auth/supabaseAuth.ts`) — sign
up and log in for real once a project is configured, no further setup
needed. **Facebook and Apple are wired in code but need provider setup
you have to do yourself**: each requires creating an OAuth app in that
provider's own developer console (Meta for Developers, Apple Developer —
separate accounts Claude can't create on your behalf) and pasting the
resulting client ID/secret into Supabase's Authentication → Providers
page. Until a given provider is enabled there, tapping its button fails
with a clear error ("Sign-in did not return a session — is this provider
enabled in Supabase?") rather than crashing. Apple in particular: App
Store review expects native Sign in with Apple
(`expo-apple-authentication`) rather than the generic web-OAuth flow used
here — that's a follow-up, not done in this pass (see "What's not
implemented"). **Google uses a different, better path** — see "Google
Sign-In (native)" below.

### Google Sign-In (native)

Google's button uses the real native Google account picker
(`@react-native-google-signin/google-signin`) rather than Facebook/Apple's
generic web-OAuth redirect — better UX, and it's what Google's own docs
recommend for mobile apps. The trade-off is more setup, all in [Google
Cloud Console](https://console.cloud.google.com/apis/credentials):

1. Create (or pick) a project, then **Create Credentials → OAuth client
   ID** three times, once each for:
   - **Web application** — no redirect URI needed. Copy its **Client
     ID**; this is what audiences the ID token Google issues, so both
     the app and Supabase have to agree on it.
   - **iOS** — Bundle ID `app.hound.mobile` (`app.json`'s
     `ios.bundleIdentifier`). Copy its **Client ID**, then reverse it
     (`1234-abc.apps.googleusercontent.com` →
     `com.googleusercontent.apps.1234-abc`) into `app.json`'s
     `plugins` entry for `@react-native-google-signin/google-signin`,
     replacing the `REPLACE_WITH_YOUR_IOS_CLIENT_ID` placeholder. This
     is a static app.json edit, not an env var — it has to exist before
     `expo prebuild` runs.
   - **Android** — package name `app.hound.mobile` plus your signing
     certificate's SHA-1 fingerprint (`keytool -list -v -keystore
     ~/.android/debug.keystore` for a debug build; get release's from
     wherever you manage that keystore, or from EAS Build's credentials
     if you use it).
2. `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in `.env` — the **Web** client ID
   from step 1, not the iOS or Android one.
3. Supabase dashboard → Authentication → Providers → Google: paste in
   that same Web client ID plus its client secret, enable.
4. Needs a native rebuild either way (`npx expo prebuild --clean` +
   `expo run:ios` / `expo run:android`) — this is a native module, so it
   doesn't exist in Expo Go and can't be picked up by just reloading JS.

Without `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` set, tapping Google shows a
clear "needs this env var" error (`src/auth/googleSignIn.ts`) rather than
crashing or silently falling back — this is independent of whether
Supabase itself is configured, since the token exchange
(`supabase.auth.signInWithIdToken`) needs both sides. On the web preview
(`expo start --web`) Google always shows "isn't available in the web
preview" — the underlying package's web implementation is a paid-sponsor
feature this project doesn't have, so it's a real limitation, not
something worth working around.

**Challenge data**: `src/challenges/supabaseChallenges.ts` implements
`listMyChallenges`, `getLeaderboard`, `createChallenge`, and
`recordProgress` against the schema above. Right now only
`CreateScreen.tsx`'s "Start the challenge" button calls it (creating a
real row + joining yourself as a participant, when a project is
configured) — the Challenges list and Hunt screen still render
`src/data/sampleData.ts`'s static content either way. Wiring their
*reads* to real data is a deliberate follow-up, not an oversight: it needs
a formatter that turns raw rows into the same hand-tuned display strings
(colors, "Day 9 of 21", per-person avatar tints) the sample data already
has baked in, and this sandbox has no live Supabase project to verify
that formatter's output against — see "What this sandbox could and
couldn't verify".

## The auth layer

`RootNavigator.tsx` renders either the auth screens (Welcome → Login/SignUp)
or the main app, switched on `useAuth().status` — the standard React
Navigation pattern for gating an app behind sign-in (swapping which
`Stack.Screen`s are mounted, rather than navigating within one shared
stack, so there's no back button into Welcome once you're signed in).
`useAuth().initializing` covers the brief async gap while a Supabase
session is being restored from storage on cold start; `RootNavigator`
shows a spinner rather than flashing Welcome first.

- `src/auth/AuthContext.tsx` — `useAuth()` exposes `status`, `user`,
  `initializing`, and `signInWithGoogle` / `signInWithFacebook` /
  `signInWithApple` / `signInWithEmail` / `signUpWithEmail` / `signOut`.
  It picks `supabaseAuth.ts` or `mockAuth.ts` once, at import time, based
  on `isSupabaseConfigured` — every screen calls the same functions
  either way.
- `src/auth/supabaseAuth.ts` — real Supabase Auth, used whenever a
  project is configured (see "The backend (Supabase)" above).
- `src/auth/mockAuth.ts` — used otherwise. The three provider buttons
  resolve to a fake profile after a simulated delay, with no real
  Google/Facebook/Apple SDK involved. Email sign-in/sign-up do basic
  client-side validation plus a couple of deliberately-reachable failure
  paths (a known email, a password under 6 characters) so the error
  states aren't purely theoretical.
- Session persistence: real, but only on the Supabase path — it stores
  the session in `AsyncStorage` and restores it on cold start
  (`AuthContext.tsx`'s `useEffect`). Mock auth never persisted anything
  and still doesn't; signing out or reloading the app while unconfigured
  always resets to signed-out.

## The health data layer

`src/health/types.ts` defines a platform-agnostic `HealthProvider` interface.
Screens only ever call `useHealthProvider()` (`src/health/HealthContext.tsx`) —
they never import a platform SDK directly.

- `src/health/iosProvider.ts` — real HealthKit calls via `@kingstinct/react-native-healthkit`.
- `src/health/androidProvider.ts` — real Health Connect calls via `react-native-health-connect`.
- `src/health/mockProvider.ts` — sample data, used automatically whenever the
  native module isn't linked (Expo Go, web, or this repo's dev sandbox) or
  `isAvailable()` returns false. This is what makes the app runnable without
  a device at all.

`resolveHealthProvider()` in `src/health/index.ts` tries the real platform
provider first and falls back to mock on *any* failure — it never throws, so
a screen always has something to render.

## Running it

```
npm install
npx expo start          # Expo Go — screens, navigation, mock health data
npx expo start --web    # fastest way to eyeball the UI in a browser
```

**Expo Go / `--web` only exercise the mock provider.** HealthKit and Health
Connect are native modules and are not present in Expo Go. To actually pull
real device data:

```
npx expo prebuild        # generates ios/ and android/ native projects
npx expo run:ios         # needs Xcode, so needs a Mac
npx expo run:android     # needs Android Studio / the Android SDK
```

or build a dev client with EAS (`eas build --profile development`) if you'd
rather not install the native toolchains locally.

### iOS specifics
- Needs a Mac with Xcode — there is no way around this, it's an Apple
  platform requirement, not a project limitation.
- `app.json`'s `ios.entitlements` already requests the HealthKit capability
  and `ios.infoPlist` carries the required usage-description strings. EAS
  Build can provision the HealthKit capability automatically; a local
  `expo run:ios` build needs it enabled once in Xcode's Signing &
  Capabilities tab (should be enabled by `expo prebuild` and then be picked up automatically after that).
- Test on a real device or the iOS Simulator (the Simulator has *no* real
  health data — seed some in the Simulator's Health app first, or leave it
  empty to see the app's own "no data" paths).
- Uses `@kingstinct/react-native-healthkit` (backed by
  `react-native-nitro-modules`), not the older `react-native-health`.
  React Native removed Old Architecture support from its own Podfile
  tooling as of RN 0.82 (`pod install` now always forces
  `RCT_NEW_ARCH_ENABLED=1` — see `warn_if_new_arch_disabled` in
  `react_native_pods.rb` — so `newArchEnabled: false` in app.json is a
  no-op on current React Native and can't be used to opt out). This
  project's RN version is 0.86.3, well past that point.
  `react-native-health`@1.19.0 (its latest release) is a legacy
  (non-Turbo) native module that predates the New Architecture; under
  bridgeless mode its native module never registered with the JS bridge
  at all, so every call on it — starting with `isAvailable()` — threw
  `TypeError: undefined is not a function` at runtime, and the app
  silently fell back to mock data with no crash and no permission prompt.
  `@kingstinct/react-native-healthkit` is a Nitro Module, i.e. built for
  the New Architecture from the ground up, which avoids that whole class
  of interop bug instead of patching around it. Its config plugin
  (referenced by bare package name in `app.json`'s `plugins`, since unlike
  Health Connect's it's plain JS and Expo's auto-discovery resolves it
  fine) sets the HealthKit entitlement; `{ "background": false }` opts out
  of the background-delivery entitlement the plugin would otherwise add by
  default, since this app doesn't use background delivery.
- HealthKit's read-authorization status is deliberately unreliable by
  design — `authorizationStatusFor()` distinguishes "never asked" from
  everything else, but not "granted" from "denied" for *read* types (Apple
  never reports that back to the calling app, for privacy). `iosProvider.ts`
  treats "not determined" as the only meaningful distinct status.

### Android specifics
- Needs the Health Connect app. Android 14+ ships it in-box; earlier
  versions need it installed from Play. The Android emulator's default
  system image usually does **not** include it — use a Google Play system
  image, or install the Health Connect APK manually.
- `app.json`'s `android.permissions` already lists the
  `android.permission.health.READ_*` entries `react-native-health-connect`
  needs.
- `app.json`'s config-plugins list references `./plugins/withHealthConnect.js`
  instead of the bare `"react-native-health-connect"` package name. That
  file is a vendored copy of the package's own `app.plugin.js` (same
  AndroidManifest mod, byte-for-byte at the time it was copied) — Expo's
  auto-discovery of that file inside the package has failed with
  `PluginError: Unexpected token 'typeof'` on at least one real machine
  (not reproducible in the sandbox this project was originally built in,
  so the exact trigger is unconfirmed). Referencing the mod by a local path
  sidesteps that resolution entirely. If you upgrade
  `react-native-health-connect`, diff its new `app.plugin.js` against
  `plugins/withHealthConnect.js` and port any changes.

### What this sandbox could and couldn't verify

This app was built in a container with no iOS Simulator, no Android
emulator, and no physical device attached. What *was* verified here:
- `npx tsc --noEmit` — clean, no type errors.
- `npx expo prebuild --platform ios` / `--platform android` — both generate
  native projects cleanly; the iOS entitlements and Info.plist keys the
  HealthKit and Google Sign-In config plugins are supposed to add
  (including the reversed `iosUrlScheme` — see "Google Sign-In (native)")
  were checked in the generated `ios/` output.
- `npx expo export --platform ios` and `--platform android` — both bundle
  cleanly (4,200+ modules resolve, including `@kingstinct/react-native-healthkit`,
  `react-native-health-connect`, and `@react-native-google-signin/google-signin`),
  so there's no import/resolution error waiting to surface on a real build.
- The full UI, every screen, and every interaction (wizard steps, slider,
  toggles, tab switches, navigation, the full sign-in flow, the Create
  wizard) — visually verified end-to-end via `expo start --web` in a real
  browser, running against mock health data and mock auth (no Supabase
  project configured).

What was **not** verified, because it requires things this sandbox doesn't
have: an actual HealthKit or Health Connect permission prompt, real device
sensor data flowing through `iosProvider.ts` / `androidProvider.ts`, native
builds (`expo run:ios` / `expo run:android` / EAS), and — new since the
Supabase integration — anything on the real Supabase code path at all.
`supabaseAuth.ts` and `supabaseChallenges.ts` are written carefully against
Supabase's documented client API and the schema in
`supabase/migrations/0001_challenges_schema.sql` (which the two are kept
consistent with), and `tsc` and the bundler both accept them, but there is
no live Supabase project in this sandbox to run a single query against —
treat both files, and the OAuth redirect flow in particular, as unverified
until someone runs them against a real project. Same story for
`src/auth/googleSignIn.ts`: no Google Cloud project or physical device
either, so the only things actually exercised here are the "not
configured" and "web preview" error paths (confirmed via `expo start
--web` — the Google button still resolves through mock auth exactly as
before, and the new native import doesn't break bundling for anyone who
isn't using it). The real native sign-in call, the ID-token exchange, and
`app.json`'s reversed `iosUrlScheme` are unverified beyond "the plugin
generates the Info.plist entry it says it will."

## What's not implemented

Challenges, friends, and invites still render `src/data/sampleData.ts`'s
static content — the Challenges list, Hunt screen, and Friends screen
don't read from Supabase yet, even when a project is configured, though
the backend to back them exists now (see "The backend (Supabase)"). The
one exception is `CreateScreen.tsx`, which does persist a real challenge
when configured. HealthKit/Health Connect only cover *your own* metrics
regardless; actually syncing a friend's steps into a shared leaderboard
needs `progress_snapshots` rows written from their device, which nothing
does yet (`recordProgress()` exists but nothing calls it — that's the
same follow-up as the leaderboard reads above, from the other direction).

Facebook/Apple sign-in is wired to real Supabase OAuth calls but needs
each provider configured in your Supabase dashboard (and, for Apple,
ideally replaced with the native `expo-apple-authentication` flow before
shipping to the App Store) before tapping those buttons does anything
but show an error. Google sign-in is wired natively
(`@react-native-google-signin/google-signin` + `signInWithIdToken`) but
needs three OAuth clients created in Google Cloud Console, one Info.plist
edit in `app.json`, and a native rebuild before it does anything either
— see "The backend (Supabase)" → "Google Sign-In (native)" for the full
checklist either way.
