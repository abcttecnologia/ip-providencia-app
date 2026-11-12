import { onAuthStateChanged } from 'firebase/auth';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth } from '@/services/firebase';
import { registrarNotificacoes } from '@/services/notificacoes';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        void registrarNotificacoes();
      }
    });

    const appStateSubscription = AppState.addEventListener(
      'change',
      (state) => {
        if (state === 'active' && auth.currentUser) {
          void registrarNotificacoes();
        }
      },
    );

    return () => {
      unsubscribeAuth();
      appStateSubscription.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider
        value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
      >
        <Stack>

          <Stack.Screen
            name="(auth)"
            options={{ headerShown: false }}
          />


          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="dizimos"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="agenda"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="configuracoes"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="player"
            options={{ headerShown: false }}
          />
        </Stack>

        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
