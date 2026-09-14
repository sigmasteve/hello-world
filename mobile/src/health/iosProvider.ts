import AppleHealthKit, {
  HealthInputOptions,
  HealthKitPermissions,
  HealthPermission,
  HealthValue,
} from 'react-native-health';
import type {
  DailySteps,
  HealthAuthStatus,
  HealthProvider,
  HealthSnapshot,
  WorkoutSample,
} from './types';

// Real HealthKit integration. Requires a custom dev client or a standalone
// build (`npx expo prebuild` + `expo run:ios`, or an EAS dev-client build) —
// HealthKit is a native module and is NOT available in Expo Go. Permission
// strings also need `NSHealthShareUsageDescription` /
// `NSHealthUpdateUsageDescription` in app.json's `ios.infoPlist`, and the
// HealthKit capability + entitlement enabled for the bundle ID (see
// app.json's `ios.entitlements` in this project, and Xcode's Signing &
// Capabilities tab for a bare/prebuilt project).

const PERMS: HealthKitPermissions = {
  permissions: {
    read: [
      HealthPermission.Steps,
      HealthPermission.DistanceWalkingRunning,
      HealthPermission.HeartRate,
      HealthPermission.RestingHeartRate,
      HealthPermission.BodyMass,
      HealthPermission.Workout,
    ],
    write: [],
  },
};

function initHealthKit(): Promise<void> {
  return new Promise((resolve, reject) => {
    AppleHealthKit.initHealthKit(PERMS, (error) => {
      if (error) reject(new Error(error));
      else resolve();
    });
  });
}

function metersToMiles(m: number): number {
  return m / 1609.344;
}
function kgToLb(kg: number): number {
  return kg * 2.20462;
}

export const iosHealthProvider: HealthProvider = {
  platform: 'ios',
  platformLabel: 'Apple Health',

  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      AppleHealthKit.isAvailable((err, available) => resolve(!err && !!available));
    });
  },

  async getAuthorizationStatus(): Promise<HealthAuthStatus> {
    // react-native-health doesn't expose a pure status check distinct from
    // initHealthKit's own permission prompt; a successful init means the
    // user has been asked (Apple never reports read-permission grant state
    // back to the app, by design — the practical signal is "did a read
    // call return data").
    try {
      await initHealthKit();
      return 'authorized';
    } catch {
      return 'not-determined';
    }
  },

  async requestAuthorization(): Promise<HealthAuthStatus> {
    try {
      await initHealthKit();
      return 'authorized';
    } catch {
      return 'denied';
    }
  },

  async getSnapshot(): Promise<HealthSnapshot> {
    await initHealthKit();
    const options: HealthInputOptions = { unit: 'mile' as never, date: new Date().toISOString() };

    const [steps, distance, restingHr, weight] = await Promise.all([
      new Promise<number>((resolve) =>
        AppleHealthKit.getStepCount(options, (err, r: HealthValue) => resolve(err ? 0 : r.value)),
      ),
      new Promise<number>((resolve) =>
        AppleHealthKit.getDistanceWalkingRunning(options, (err, r: HealthValue) =>
          resolve(err ? 0 : metersToMiles(r.value)),
        ),
      ),
      new Promise<number | null>((resolve) =>
        AppleHealthKit.getRestingHeartRate(options, (err, r: HealthValue) =>
          resolve(err ? null : r.value),
        ),
      ),
      new Promise<number | null>((resolve) =>
        AppleHealthKit.getLatestWeight({ unit: 'pound' as never }, (err, r: HealthValue) =>
          resolve(err ? null : r.value),
        ),
      ),
    ]);

    return {
      stepsToday: Math.round(steps),
      stepsGoal: 10000,
      distanceTodayMi: Math.round(distance * 10) / 10,
      restingHeartRateBpm: restingHr,
      latestWeightLb: weight,
      source: 'Apple Health',
      lastSyncedAt: new Date(),
    };
  },

  async getWeeklySteps(): Promise<DailySteps[]> {
    await initHealthKit();
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    return new Promise((resolve) => {
      AppleHealthKit.getDailyStepCountSamples(
        { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        (err, results: HealthValue[]) => {
          if (err || !results) return resolve([]);
          resolve(
            results.map((r) => ({
              date: new Date(r.startDate).toLocaleDateString(undefined, { weekday: 'short' }),
              steps: Math.round(r.value),
            })),
          );
        },
      );
    });
  },

  async getHeartRateSeries(days: number): Promise<number[]> {
    await initHealthKit();
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    return new Promise((resolve) => {
      AppleHealthKit.getRestingHeartRateSamples(
        { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        (err, results: HealthValue[]) => resolve(err || !results ? [] : results.map((r) => r.value)),
      );
    });
  },

  async getWeightSeries(days: number): Promise<number[]> {
    await initHealthKit();
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    return new Promise((resolve) => {
      AppleHealthKit.getWeightSamples(
        { startDate: startDate.toISOString(), endDate: endDate.toISOString(), unit: 'pound' as never },
        (err, results: HealthValue[]) => resolve(err || !results ? [] : results.map((r) => r.value)),
      );
    });
  },

  async getRecentWorkouts(limit: number): Promise<WorkoutSample[]> {
    await initHealthKit();
    return new Promise((resolve) => {
      AppleHealthKit.getSamples(
        { type: 'Workout' as never, startDate: new Date(0).toISOString(), limit, ascending: false } as never,
        (err, results: any[]) => {
          if (err || !results) return resolve([]);
          resolve(
            results.slice(0, limit).map((w, i) => ({
              id: w.id ?? String(i),
              name: w.activityName ?? 'Workout',
              when: new Date(w.start),
              source: 'Apple Health',
              distanceMi: w.distance ? metersToMiles(w.distance) : undefined,
              avgHeartRate: undefined,
            })),
          );
        },
      );
    });
  },
};
