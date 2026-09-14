// The shape every screen reads from — platform-agnostic. Screens never
// import react-native-health or react-native-health-connect directly; they
// go through `useHealth()` / `getHealthProvider()` from ./index.ts.

export type SourceLabel = string; // e.g. "Apple Health · iPhone 15", "Health Connect · Pixel 8"

export interface DailySteps {
  date: string; // 'YYYY-MM-DD'
  steps: number;
}

export interface WorkoutSample {
  id: string;
  name: string;
  when: Date;
  source: SourceLabel;
  distanceMi?: number;
  avgHeartRate?: number;
}

export interface HealthSnapshot {
  stepsToday: number;
  stepsGoal: number;
  distanceTodayMi: number;
  restingHeartRateBpm: number | null;
  latestWeightLb: number | null;
  source: SourceLabel;
  lastSyncedAt: Date | null;
}

export type HealthAuthStatus = 'unavailable' | 'not-determined' | 'denied' | 'authorized';

export interface HealthProvider {
  readonly platform: 'ios' | 'android' | 'mock';
  readonly platformLabel: string; // "Apple Health" | "Health Connect" | "Sample data"

  isAvailable(): Promise<boolean>;
  getAuthorizationStatus(): Promise<HealthAuthStatus>;
  requestAuthorization(): Promise<HealthAuthStatus>;

  getSnapshot(): Promise<HealthSnapshot>;
  getWeeklySteps(): Promise<DailySteps[]>;
  getHeartRateSeries(days: number): Promise<number[]>;
  getWeightSeries(days: number): Promise<number[]>;
  getRecentWorkouts(limit: number): Promise<WorkoutSample[]>;
}
