import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { THEME } from '../src/core/constants';

void SplashScreen.preventAutoHideAsync();

const owlTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: THEME.bg,
    card: THEME.bg,
    text: THEME.fg,
    border: THEME.border,
    primary: THEME.accent,
  },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Geist_400Regular: require('../assets/fonts/Geist_400Regular.ttf'),
    Geist_500Medium: require('../assets/fonts/Geist_500Medium.ttf'),
    Geist_600SemiBold: require('../assets/fonts/Geist_600SemiBold.ttf'),
    GeistMono_400Regular: require('../assets/fonts/GeistMono_400Regular.ttf'),
    GeistMono_500Medium: require('../assets/fonts/GeistMono_500Medium.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider value={owlTheme}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: THEME.bg } }} />
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
