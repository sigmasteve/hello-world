import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { color } from '../theme/tokens';
import type { RootStackParamList } from './types';
import { MainScreen } from '../screens/MainScreen';
import { HuntScreen } from '../screens/HuntScreen';
import { CreateScreen } from '../screens/CreateScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: color.bg,
    card: color.bg,
    text: color.text,
    border: color.divider,
    primary: color.accent,
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="Hunt" options={{ animation: 'slide_from_right' }}>
          {({ navigation }) => (
            // "All challenges" always lands on the Challenges tab, regardless
            // of whether Hunt was opened from Home, Challenges, or just-created
            // via the wizard — matching the label, not just popping the stack.
            <HuntScreen onBack={() => navigation.navigate('Main', { tab: 'challenges' })} />
          )}
        </Stack.Screen>
        <Stack.Screen name="Create" options={{ animation: 'slide_from_bottom' }}>
          {({ navigation }) => (
            <CreateScreen
              onCancel={() => navigation.goBack()}
              onFinish={() => navigation.replace('Hunt')}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
