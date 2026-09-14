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
  components/   shared UI primitives (Button, Card, Tag, Avatar, …)
  navigation/   React Navigation stack — Main (tab-style content switcher,
                matching the web's persistent top nav) + Hunt/Create as
                pushed detail screens
  screens/      one file per screen (Home, Hunt, Challenges, Create wizard,
                Metrics, Friends, Settings, Connect)
  health/       the HealthKit/Health Connect abstraction (see below)
  data/         sample data for the social layer (challenges, friends) —
                there's no backend, see "What's not implemented"
```

## The health data layer

`src/health/types.ts` defines a platform-agnostic `HealthProvider` interface.
Screens only ever call `useHealthProvider()` (`src/health/HealthContext.tsx`) —
they never import a platform SDK directly.

- `src/health/iosProvider.ts` — real HealthKit calls via `react-native-health`.
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
- `react-native-health`@1.19.0's native code fails to compile against
  current React Native (`no visible @interface for 'RCTCallableJSModules'
  declares the selector 'setBridge:'`) — that method no longer exists on
  the class. `patches/react-native-health+1.19.0.patch` (applied
  automatically via `postinstall`, `patch-package`) removes the few lines
  causing it; see the comment left in the patched file for why. Confirmed
  unresolved upstream as of this writing (same code on the package's
  `master` branch, not just the npm release). If you bump this dependency,
  re-check whether it's been fixed upstream before assuming the patch
  still applies.
- `react-native-health`'s `HealthPermission` is a TypeScript-only enum —
  the package's actual JS entry (`index.js`) is a plain
  `module.exports = HealthKit` default object with no named exports at
  all, so `import { HealthPermission } from 'react-native-health'` resolves
  to `undefined` at runtime and `HealthPermission.Steps` throws. Use the
  default export's `AppleHealthKit.Constants.Permissions.*` instead (same
  string values, but a real JS object backing it) — see `iosProvider.ts`.

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
- `npx expo export --platform ios` and `--platform android` — both bundle
  cleanly (4,200+ modules resolve, including `react-native-health` and
  `react-native-health-connect`), so there's no import/resolution error
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
