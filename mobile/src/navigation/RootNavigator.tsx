import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { color } from '../theme/tokens';
import type { RootStackParamList } from './types';
import { MainScreen } from '../screens/MainScreen';
import { HuntScreen } from '../screens/HuntScreen';
import { CreateScreen } from '../screens/CreateScreen';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { useAuth } from '../auth/AuthContext';

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
  const { status } = useAuth();

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {status === 'signedOut' ? (
          // Rendering a completely different set of Stack.Screen children
          // swaps the navigator's whole state — the standard React
          // Navigation auth-flow pattern. Signing in immediately replaces
          // this group with the Main one below; there's no back button
          // into Welcome/Login/SignUp afterwards.
          <Stack.Group>
            <Stack.Screen name="Welcome">
              {({ navigation }) => (
                <WelcomeScreen
                  onContinueWithEmail={() => navigation.navigate('Login')}
                  onCreateAccount={() => navigation.navigate('SignUp')}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Login" options={{ animation: 'slide_from_right' }}>
              {({ navigation }) => (
                <LoginScreen onBack={() => navigation.goBack()} onCreateAccount={() => navigation.navigate('SignUp')} />
              )}
            </Stack.Screen>
            <Stack.Screen name="SignUp" options={{ animation: 'slide_from_right' }}>
              {({ navigation }) => (
                <SignUpScreen onBack={() => navigation.goBack()} onLogIn={() => navigation.navigate('Login')} />
              )}
            </Stack.Screen>
          </Stack.Group>
        ) : (
          <Stack.Group>
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
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
