import { Platform } from 'react-native';
import { mockProvider } from './mockProvider';
import type { HealthProvider } from './types';

export * from './types';

// Resolves to the real platform provider when its native module is linked
// and reachable, otherwise falls back to sample data — this is what makes
// the app runnable in Expo Go / this sandbox (no native modules) and on a
// real device/dev-client build alike, without screens caring which one
// they got. Never throws.
export async function resolveHealthProvider(): Promise<HealthProvider> {
  try {
    if (Platform.OS === 'ios') {
      const { iosHealthProvider } = await import('./iosProvider');
      if (await iosHealthProvider.isAvailable()) return iosHealthProvider;
    } else if (Platform.OS === 'android') {
      const { androidHealthProvider } = await import('./androidProvider');
      if (await androidHealthProvider.isAvailable()) return androidHealthProvider;
    }
  } catch {
    // Native module not linked (Expo Go, web, or this build has no
    // dev-client) — fall through to mock below.
  }
  return mockProvider;
}
