export type MainTab = 'home' | 'challenges' | 'metrics' | 'friends' | 'settings' | 'connect';

export type RootStackParamList = {
  Main: { tab?: MainTab } | undefined;
  Hunt: undefined;
  Create: undefined;
};
