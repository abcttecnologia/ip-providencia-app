import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider
      value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
    >
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="dizimos"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="agenda"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="player"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="hinario"
          options={{
            headerShown: false,
          }}
        />

      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}