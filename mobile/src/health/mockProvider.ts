import type { DailySteps, HealthAuthStatus, HealthProvider, HealthSnapshot, WorkoutSample } from './types';

// Sample-data provider — used automatically whenever the platform module
// isn't linked (Expo Go, this dev sandbox, or web), so every screen has
// something real-looking to render without a device. Numbers mirror the
// original static prototype so the UI reads identically either way.
export const mockProvider: HealthProvider = {
  platform: 'mock',
  platformLabel: 'Sample data',

  async isAvailable() {
    return true;
  },
  async getAuthorizationStatus(): Promise<HealthAuthStatus> {
    return 'authorized';
  },
  async requestAuthorization(): Promise<HealthAuthStatus> {
    return 'authorized';
  },

  async getSnapshot(): Promise<HealthSnapshot> {
    return {
      stepsToday: 8432,
      stepsGoal: 10000,
      distanceTodayMi: 3.8,
      restingHeartRateBpm: 58,
      latestWeightLb: 178.4,
      source: 'Apple Health',
      lastSyncedAt: new Date(Date.now() - 4 * 60 * 1000),
    };
  },

  async getWeeklySteps(): Promise<DailySteps[]> {
    const counts = [5680, 8090, 3760, 6790, 8810, 3210, 8432];
    const labels = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Today'];
    return labels.map((label, i) => ({ date: label, steps: counts[i] }));
  },

  async getHeartRateSeries(): Promise<number[]> {
    return [62, 61, 59, 60, 58, 57, 58];
  },

  async getWeightSeries(): Promise<number[]> {
    return [181, 180.6, 180.1, 179.4, 179.2, 178.6, 178.4];
  },

  async getRecentWorkouts(limit: number): Promise<WorkoutSample[]> {
    const all: WorkoutSample[] = [
      { id: '1', name: 'Trail run', when: daysAgo(0, 8, 2), source: 'Apple Health', distanceMi: 7.8, avgHeartRate: 148 },
      { id: '2', name: 'Lunch walk', when: daysAgo(1, 12, 20), source: 'Apple Health', distanceMi: 2.4, avgHeartRate: 96 },
      { id: '3', name: 'Cycling', when: daysAgo(2, 9, 15), source: 'Strava → Health Connect', distanceMi: 14.2, avgHeartRate: 132 },
      { id: '4', name: 'Strength', when: daysAgo(3, 18, 30), source: 'Apple Watch', avgHeartRate: 118 },
      { id: '5', name: 'Evening walk', when: daysAgo(4, 19, 45), source: 'Apple Health', distanceMi: 1.9, avgHeartRate: 92 },
    ];
    return all.slice(0, limit);
  },
};

function daysAgo(days: number, hour: number, minute: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d;
}
