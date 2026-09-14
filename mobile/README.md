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
  data/         sample data for the social layer (challenges, friends) —
                there's no backend, see "What's not implemented"
```

## The auth layer

`RootNavigator.tsx` renders either the auth screens (Welcome → Login/SignUp)
or the main app, switched on `useAuth().status` — the standard React
Navigation pattern for gating an app behind sign-in (swapping which
`Stack.Screen`s are mounted, rather than navigating within one shared
stack, so there's no back button into Welcome once you're signed in).

- `src/auth/AuthContext.tsx` — `useAuth()` exposes `status`, `user`, and
  `signInWithGoogle` / `signInWithFacebook` / `signInWithApple` /
  `signInWithEmail` / `signUpWithEmail` / `signOut`.
- `src/auth/mockAuth.ts` — **entirely mocked**, matching the rest of the
  app's "no backend yet" state (see "What's not implemented"). The three
  provider buttons resolve to a fake profile after a simulated delay, with
  no real Google/Facebook/Apple SDK involved. Email sign-in/sign-up do
  basic client-side validation plus a couple of deliberately-reachable
  failure paths (`jordan.lee@gmail.com` / a password under 6 characters)
  so the error states aren't purely theoretical. Swapping in a real
  backend (Firebase Auth, Auth0, a custom API, or the real
  `expo-auth-session` / `@react-native-google-signin` / `expo-apple-authentication`
  SDKs) means rewriting `mockAuth.ts` — `AuthContext.tsx` and every screen
  are written against its function signatures, not its implementation.
- No session persistence: signing out or reloading the app resets to
  signed-out, since there's no `AsyncStorage`/`SecureStore` layer yet and
  nothing to restore a session from even if there were.

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
  HealthKit config plugin is supposed to add were checked in the generated
  `ios/` output.
- `npx expo export --platform ios` and `--platform android` — both bundle
  cleanly (4,200+ modules resolve, including `@kingstinct/react-native-healthkit`
  and `react-native-health-connect`), so there's no import/resolution error
  waiting to surface on a real build.
- The full UI, every screen, and every interaction (wizard steps, slider,
  toggles, tab switches, navigation) — visually verified end-to-end via
  `expo start --web` in a real browser, running against the mock health
  provider.

What was **not** verified, because it requires hardware this sandbox
doesn't have: an actual HealthKit or Health Connect permission prompt, real
device sensor data flowing through `iosProvider.ts` / `androidProvider.ts`,
and native builds (`expo run:ios` / `expo run:android` / EAS). Treat those
two provider files as carefully-written but untested against the real
native APIs until someone runs them on a device.

## What's not implemented

Challenges, friends, and invites are still the same static sample data the
original prototype shipped with (`src/data/sampleData.ts`) — there's no
backend. HealthKit/Health Connect only cover *your own* metrics; syncing
challenge state between friends' phones needs a real server, which is a
separate project.

Sign-in (`src/auth/`) is UI-complete but backend-mocked: no real Google,
Facebook, or Apple SDK is wired up, there's no server verifying
credentials, and nothing persists a session across an app restart. See
"The auth layer" above for what a real integration needs to replace.
